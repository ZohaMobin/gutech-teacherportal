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

                if (jsonData.length === 0) {
                    showError("The file appears to be empty. Please check the file and try again.");
                    reject("Empty file");
                    return;
                }

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

                // Maps for assessments and students
                const assessmentMap = {};
                const studentMap = {};
                
                // Initialize student map with existing students
                students.forEach(s => {
                    studentMap[s.id] = {
                        ...s,
                        marks: s.marks ? { ...s.marks } : {} // Safely initialize marks as object
                    };
                });

                // Process each row in the imported data
                for (const row of jsonData) {
                    const assessmentId = parseInt(row["Assessment ID"]);
                    const weightage = parseFloat(row["Weightage"]);
                    const totalMarks = parseFloat(row["Total Marks"]);
                    const studentId = parseInt(row["Student ID"]);
                    const studentName = row["Student Name"]?.trim() || `Student ${studentId}`;
                    const obtainedMarks = parseFloat(row["Obtained Marks"]);

                    // Check if mandatory values are missing or invalid
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

                    // Add new assessment to the map if it doesn't exist yet
                    if (!assessmentMap[assessmentId]) {
                        assessmentMap[assessmentId] = {
                            id: assessmentId,
                            weightage,
                            total: totalMarks,
                            avg: 0,
                            status: "Draft",
                            modified: false,
                            marks: [],
                            sectionId: activeSection._id, // Store sectionId explicitly
                            courseId: activeSubject.id,   // Store courseId explicitly
                            type: activeTab
                        };
                    }

                    // Add obtained marks to the assessment's marks array
                    if (!Array.isArray(assessmentMap[assessmentId].marks)) {
                        assessmentMap[assessmentId].marks = [];
                    }
                    assessmentMap[assessmentId].marks.push(obtainedMarks);

                    // Add or update student
                    if (!studentMap[studentId]) {
                        // If this is a new student ID, create a new student entry
                        studentMap[studentId] = {
                            id: studentId,
                            name: studentName,
                            rollNumber: studentId.toString(), // Use ID as roll number if needed
                            marks: {}
                        };
                    }

                    // Ensure marks object exists and add the obtained mark for this assessment
                    if (!studentMap[studentId].marks) {
                        studentMap[studentId].marks = {};
                    }
                    studentMap[studentId].marks[assessmentId] = obtainedMarks;
                }

                // Calculate averages for each assessment
                const newAssessments = Object.values(assessmentMap).map(a => {
                    const avg = a.marks && a.marks.length > 0
                        ? Math.round((a.marks.reduce((sum, m) => sum + m, 0) / a.marks.length) * 10) / 10
                        : 0;
                    
                    return {
                        ...a,
                        avg,
                        // Remove the marks array as it's not needed in the assessment object
                        marks: undefined
                    };
                });

                // Update the state with new data
                setStudents(Object.values(studentMap));
                
                // Always call setAssessments callback with the complete array of new assessments
                setAssessments(newAssessments);
                
                resolve(newAssessments); // Return the new assessments for further processing
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
    if (!assessments || assessments.length === 0) {
        showError("No assessments to export.");
        return;
    }

    try {
        const workbook = XLSX.utils.book_new();

        // Create Assessments Sheet
        const assessmentHeaders = ['Assessment ID', 'Weightage', 'Total Marks', 'Average', 'Status'];
        const assessmentData = assessments.map(a => [a.id, a.weightage, a.total, a.avg, a.status]);
        const assessmentSheet = XLSX.utils.aoa_to_sheet([assessmentHeaders, ...assessmentData]);
        XLSX.utils.book_append_sheet(workbook, assessmentSheet, 'Assessments');

        // Create Students Marks Sheet with one row per student per assessment
        const marksData = [];
        
        // Add headers
        marksData.push(['Assessment ID', 'Weightage', 'Total Marks', 'Student ID', 'Student Name', 'Obtained Marks']);
        
        // Add a row for each student for each assessment
        assessments.forEach(assessment => {
            students.forEach(student => {
                const obtainedMark = student.marks && student.marks[assessment.id] !== undefined 
                    ? student.marks[assessment.id] 
                    : 0;
                    
                marksData.push([
                    assessment.id,
                    assessment.weightage,
                    assessment.total,
                    student.id,
                    student.name || student.rollNumber,
                    obtainedMark
                ]);
            });
        });
        
        const marksSheet = XLSX.utils.aoa_to_sheet(marksData);
        XLSX.utils.book_append_sheet(workbook, marksSheet, 'Student Marks');

        // Export the Excel file with a descriptive name
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
        XLSX.writeFile(workbook, `${activeSubject}_${activeTab}_${timestamp}.xlsx`);
    } catch (error) {
        console.error("Excel export error:", error);
        showError("An error occurred while creating the export file.");
    }
};