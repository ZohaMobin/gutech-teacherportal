import * as XLSX from 'xlsx';

const showError = (message) => {
    alert(message);
};

export const handleExcelImport = (file, assessments, students, setAssessments, setStudents, activeSubject, activeSection, activeTab) => {
    return new Promise((resolve, reject) => {
        if (!file) {
            showError("Please select a file to import.");
            reject("No file selected");
            return;
        }

        // Validate file type (only allow .xlsx or .xls)
        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            showError("Invalid file format. Please upload an Excel file (.xlsx or .xls).");
            reject("Invalid file format");
            return;
        }

        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Read the first sheet (assuming it contains all data)
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                // Validate required columns
                const requiredColumns = ["Assessment ID", "Weightage", "Total Marks", "Student ID", "Student Name", "Obtained Marks"];
                const fileColumns = Object.keys(jsonData[0] || {});
                const missingColumns = requiredColumns.filter(col => !fileColumns.includes(col));

                if (missingColumns.length > 0) {
                    showError(
                        `Invalid file format. Missing required columns: ${missingColumns.join(", ")}. 
                        Expected format: Assessment ID (Number), Weightage (Number), Total Marks (Number), 
                        Student ID (Number), Student Name (Text), Obtained Marks (Number).`
                    );
                    reject("Missing required columns");
                    return;
                }

                // Check for duplicate assessment IDs within the file
                const fileAssessmentIds = new Map();
                const duplicateFileIds = new Set();

                jsonData.forEach(row => {
                    const assessmentId = parseInt(row["Assessment ID"]);
                    if (!isNaN(assessmentId)) {
                        if (fileAssessmentIds.has(assessmentId)) {
                            duplicateFileIds.add(assessmentId);
                        } else {
                            fileAssessmentIds.set(assessmentId, true);
                        }
                    }
                });

                // Check for duplicate IDs between file and existing assessments
                const existingAssessmentIds = new Set(assessments.map(a => a.id));
                const duplicatesWithExisting = [...fileAssessmentIds.keys()].filter(id => existingAssessmentIds.has(id));

                // If duplicates found in the file itself, show error and reject
                if (duplicateFileIds.size > 0) {
                    showError(
                        `Your file contains duplicate Assessment IDs: ${[...duplicateFileIds].join(", ")}. 
                        Please ensure each Assessment ID appears only once in your file and try again.`
                    );
                    reject("Duplicate Assessment IDs in file");
                    return;
                }

                // If there are duplicates with existing assessments, ask user what to do
                if (duplicatesWithExisting.length > 0) {
                    showError(
                        `Assessment IDs ${duplicatesWithExisting.join(", ")} already exist in the system. 
                        Please either use new Assessment IDs or remove these entries from your file before importing.`
                    );
                    reject("Duplicate Assessment IDs with existing data");
                    return;
                }

                // Maps for assessments and students - fixed initialization
                const assessmentMap = {};
                // Initialize assessment map with existing assessments
                assessments.forEach(a => {
                    assessmentMap[a.id] = {
                        ...a,
                        marks: Array.isArray(a.marks) ? [...a.marks] : [] // Safely initialize marks as array
                    };
                });

                const studentMap = {};
                // Initialize student map with existing students
                students.forEach(s => {
                    studentMap[s.id] = {
                        ...s,
                        marks: s.marks ? { ...s.marks } : {} // Safely initialize marks as object
                    };
                });

                for (const row of jsonData) {
                    const assessmentId = parseInt(row["Assessment ID"]);
                    const weightage = parseFloat(row["Weightage"]);
                    const totalMarks = parseFloat(row["Total Marks"]);
                    const studentId = parseInt(row["Student ID"]);
                    const studentName = row["Student Name"]?.trim() || `Student ${studentId}`;
                    const obtainedMarks = parseFloat(row["Obtained Marks"]);

                    // Check if mandatory values are missing
                    if (isNaN(assessmentId)) {
                        showError(`Invalid "Assessment ID" in file. It should be a number. Found: ${row["Assessment ID"]}`);
                        reject("Invalid Assessment ID");
                        return;
                    }
                    if (isNaN(studentId)) {
                        showError(`Invalid "Student ID" in file. It should be a number. Found: ${row["Student ID"]}`);
                        reject("Invalid Student ID");
                        return;
                    }
                    if (isNaN(obtainedMarks)) {
                        showError(`Invalid "Obtained Marks" in file. It should be a number. Found: ${row["Obtained Marks"]}`);
                        reject("Invalid Obtained Marks");
                        return;
                    }
                    if (isNaN(weightage)) {
                        showError(`Invalid "Weightage" in file. It should be a number. Found: ${row["Weightage"]}`);
                        reject("Invalid Weightage");
                        return;
                    }
                    if (isNaN(totalMarks)) {
                        showError(`Invalid "Total Marks" in file. It should be a number. Found: ${row["Total Marks"]}`);
                        reject("Invalid Total Marks");
                        return;
                    }

                    // Add new assessment (we already verified it doesn't exist)
                    if (!assessmentMap[assessmentId]) {
                        assessmentMap[assessmentId] = {
                            id: assessmentId,
                            weightage,
                            total: totalMarks,
                            avg: 0,
                            status: "Draft",
                            modified: false,
                            marks: [],
                            subject: activeSubject, // Add active subject
                            section: activeSection, // Add active section
                            type: activeTab // Add active assessment type
                        };
                    }

                    // Ensure the marks array exists before pushing
                    if (!Array.isArray(assessmentMap[assessmentId].marks)) {
                        assessmentMap[assessmentId].marks = [];
                    }
                    assessmentMap[assessmentId].marks.push(obtainedMarks);

                    // Add or update student based on Student ID
                    if (!studentMap[studentId]) {
                        studentMap[studentId] = {
                            id: studentId,
                            name: studentName,
                            marks: {}
                        };
                    }

                    // Ensure the marks object exists before adding to it
                    if (!studentMap[studentId].marks) {
                        studentMap[studentId].marks = {};
                    }
                    studentMap[studentId].marks[assessmentId] = obtainedMarks;
                }

                // Calculate updated averages
                const newAssessments = Object.values(assessmentMap).map(a => ({
                    ...a,
                    avg: a.marks && a.marks.length > 0
                        ? Math.round((a.marks.reduce((sum, m) => sum + m, 0) / a.marks.length) * 10) / 10
                        : 0
                }));

                // Update state
                setAssessments(newAssessments);
                setStudents(Object.values(studentMap));

                // In csvUtils.js - Add this at the end of handleExcelImport before resolve():
// Save imported marks to localStorage
Object.entries(assessmentMap).forEach(([assessmentId, assessment]) => {
    const marksKey = `marks_${activeSection}_${activeSubject}_${assessmentId}`;
    const studentMarksObj = {};
    
    Object.values(studentMap).forEach(student => {
      if (student.marks[assessmentId] !== undefined) {
        studentMarksObj[student.id] = student.marks[assessmentId];
      }
    });
    
    // Get existing unpublished marks from localStorage
    let unpublishedMarks = {};
    try {
      const saved = localStorage.getItem('unpublishedMarks');
      if (saved) {
        unpublishedMarks = JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading unpublished marks', e);
    }
    
    // Update with new marks
    unpublishedMarks[marksKey] = studentMarksObj;
    
    // Save back to localStorage
    localStorage.setItem('unpublishedMarks', JSON.stringify(unpublishedMarks));
  });

                resolve(); // Resolve the promise after successful processing
            } catch (error) {
                console.error("Excel import error:", error);
                showError("An error occurred while processing the file. Please check the format and try again.");
                reject(error);
            }
        };

        reader.onerror = (error) => {
            showError("An error occurred while reading the file.");
            reject(error);
        };

        reader.readAsArrayBuffer(file);
    });
};
// Function to export data to Excel
export const createExcelExport = (assessments, students, activeSubject, activeTab) => {
    const workbook = XLSX.utils.book_new();

    // Create Assessments Sheet
    const assessmentHeaders = ['Assessment ID', 'Weightage', 'Total Marks', 'Average', 'Status'];
    const assessmentData = assessments.map(a => [a.id, a.weightage, a.total, a.avg, a.status]);
    const assessmentSheet = XLSX.utils.aoa_to_sheet([assessmentHeaders, ...assessmentData]);
    XLSX.utils.book_append_sheet(workbook, assessmentSheet, 'Assessments');

    // Create Students Sheet
    const studentHeaders = ['Student ID', 'Student Name', ...assessments.map(a => `Marks for ${a.id}`)];
    const studentData = students.map(s => [
        s.id,
        s.name,
        ...assessments.map(a => (s.marks[a.id] !== undefined ? s.marks[a.id] : 'N/A'))
    ]);
    const studentSheet = XLSX.utils.aoa_to_sheet([studentHeaders, ...studentData]);
    XLSX.utils.book_append_sheet(workbook, studentSheet, 'Students');

    // Export the Excel file
    XLSX.writeFile(workbook, `${activeSubject}_${activeTab}.xlsx`);
};