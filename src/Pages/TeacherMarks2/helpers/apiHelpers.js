import axios from "axios";

// Fetch teacher sections
export const fetchTeacherSections = async (teacherId) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/section/getSections/${teacherId}`);
    
    if (response.data && response.data.length > 0) {
      // Format sections
      const formattedSections = response.data.map(section => ({
        _id: section._id,
        section: section.section,
        courseId: section.courseId._id,
        courseName: section.courseId.name,
        courseCode: section.courseId.code
      }));
      
      // Extract unique subjects
      const uniqueSubjects = Array.from(
        new Set(formattedSections.map(section => section.courseName))
      ).map(courseName => {
        const section = formattedSections.find(s => s.courseName === courseName);
        return {
          id: section.courseId,
          name: courseName,
          code: section.courseCode
        };
      });
      
      return { formattedSections, uniqueSubjects };
    }
    
    return { formattedSections: [], uniqueSubjects: [] };
  } catch (error) {
    console.error("Error fetching sections:", error);
    throw error;
  }
};

// Fetch students for a section
export const fetchStudents = async (sectionId) => {
  try {
    const response = await axios.get(`http://localhost:5000/api/enrollment/getStudents/${sectionId}`);
    
    if (response.data) {
      // Format students data
      const formattedStudents = response.data.map(student => ({
        id: student._id,
        userId: student.userId,
        rollNumber: student.rollNumber,
        name: student.rollNumber, // Using roll number as name for now
        marks: {}
      }));
      
      return formattedStudents;
    }
    
    return [];
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
};

// Save assessment marks to the API
export const saveAssessmentMarks = async (assessment, studentMarks, students, type) => {
  try {
    const date = new Date().toISOString();
    const enrollmentId = "67de03190ad325dc130689b6"; // This should be dynamic
    
    // Prepare grades data for each student
    const grades = students.map(student => {
      if (!student || !student.id) {
        console.error("Error: Invalid student object", student);
        return null;
      }
      return {
        enrollmentId: enrollmentId,
        studentId: student.id,
        type: type,
        title: assessment.id?.toString() || "Unknown",
        maxMarks: assessment.total || 0,
        obtainedMarks: studentMarks?.[student.id] ?? 0,
        date: date,
        feedback: "",
        weightage: assessment.weightage || 0
      };
    }).filter(grade => grade !== null);
    
    // Post grades to API
    for (const grade of grades) {
      await axios.post("http://localhost:5000/api/grade/", grade);
    }
    
    return true;
  } catch (error) {
    console.error("Error saving grades:", error);
    return false;
  }
};