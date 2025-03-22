// Create a new assessment
export const createNewAssessment = (newAssessment, sectionId, courseId, currentAssessments) => {
    const newId = currentAssessments.length > 0 
      ? Math.max(...currentAssessments.map((a) => a.id)) + 1 
      : 1;
  
    return {
      id: newId,
      weightage: parseInt(newAssessment.weightage),
      total: parseInt(newAssessment.total),
      avg: 0,
      status: "Draft",
      modified: false,
      sectionId: sectionId,
      courseId: courseId,
    };
  };
  
  // Calculate assessment average from student marks
  export const calculateAssessmentAverage = (assessment, studentMarks, students) => {
    if (!studentMarks || !students || students.length === 0) return 0;
    
    let total = 0;
    let count = 0;
    
    students.forEach(student => {
      const mark = studentMarks[student.id];
      if (mark !== undefined) {
        total += parseFloat(mark);
        count++;
      }
    });
    
    return count > 0 ? Math.round((total / count) * 10) / 10 : 0;
  };
  
  // Get the appropriate tab for an assessment ID (heuristic)
  export const guessTabForAssessment = (assessmentId) => {
    if (assessmentId <= 2) return "Quizzes";
    if (assessmentId <= 4) return "Assignments";
    if (assessmentId <= 6) return "Midterms";
    return "Finals";
  };
  
  // Get status color classes
  export const getStatusClasses = (status, modified) => {
    switch (status) {
      case "Published":
        return modified 
          ? "bg-yellow-100 text-yellow-800" 
          : "bg-green-100 text-green-800";
      case "Modified":
        return "bg-yellow-100 text-yellow-800";
      case "Draft":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };