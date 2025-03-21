import React, { useState } from 'react';
import { X, Download, Upload, Edit, AlertTriangle, Info } from 'lucide-react';
import StudentMarksView from './StudentMarksView';
import { handleExcelImport, createExcelExport } from './csvUtils';

const TeacherMarksManagement = () => {
    // State management
    const [activeTab, setActiveTab] = useState('Quizzes');
    const [isLoading, setIsLoading] = useState(false);
    const [activeSubject, setActiveSubject] = useState('Discrete Mathematics');
    const [activeSection, setActiveSection] = useState('sectionA');

    // Updated assessments structure to include subject and section
    const [assessments, setAssessments] = useState({
        Quizzes: [
            { id: 1, weightage: 15, total: 15, avg: 12.9, status: 'Published', modified: false, subject: 'Discrete Mathematics', section: 'sectionA' }
        ],
        Assignments: [],
        Midterms: [],
        Finals: []
    });

    const [students, setStudents] = useState([
        { id: 101, name: 'John Doe', marks: { 1: 14 } },
        { id: 102, name: 'Jane Smith', marks: { 1: 13 } },
        { id: 103, name: 'Alex Johnson', marks: { 1: 12 } },
    ]);
    const [showStudentMarks, setShowStudentMarks] = useState(false);
    const [selectedAssessment, setSelectedAssessment] = useState(null);
    const [newAssessment, setNewAssessment] = useState({ weightage: 15, total: 15 });
    const [showAddForm, setShowAddForm] = useState(false);
    const [showImportHelp, setShowImportHelp] = useState(false);

    // Tabs and subject options
    const tabs = ['Quizzes', 'Assignments', 'Midterms', 'Finals'];
    const subjects = ['Discrete Mathematics', 'Programming Fundamentals', 'Calculus'];
    const sections = ['sectionA', 'sectionB'];

    // Required columns for import
    const requiredColumns = [
        { name: "Assessment ID", type: "Number", description: "Unique identifier for the assessment" },
        { name: "Weightage", type: "Number", description: "Percentage weight of the assessment" },
        { name: "Total Marks", type: "Number", description: "Maximum possible marks" },
        { name: "Student ID", type: "Number", description: "Unique identifier for the student" },
        { name: "Student Name", type: "Text", description: "Full name of the student" },
        { name: "Obtained Marks", type: "Number", description: "Marks scored by the student" }
    ];

    // Get current assessments based on active tab, subject, and section
    const getCurrentAssessments = () => {
        return assessments[activeTab].filter(
            (assessment) =>
                assessment.subject === activeSubject &&
                assessment.section === activeSection
        );
    };

    // Handle assessment selection to show student marks
    const handleAssessmentClick = (assessment) => {
        setSelectedAssessment(assessment);
        setShowStudentMarks(true);
    };

    // Update assessment after student marks have been edited
    const updateAssessment = (updatedAssessment) => {
        setAssessments({
            ...assessments,
            [activeTab]: assessments[activeTab].map(assessment =>
                assessment.id === updatedAssessment.id ? updatedAssessment : assessment
            )
        });
        setSelectedAssessment(updatedAssessment);
    };

    // Handle import of Excel file
    const handleImport = (e) => {
        const file = e.target.files[0];
        setIsLoading(true);
    
        handleExcelImport(
            file,
            getCurrentAssessments(),
            students,
            (updatedAssessments) => {
                // Add activeSubject and activeSection to imported assessments
                const assessmentsWithContext = updatedAssessments.map((assessment) => ({
                    ...assessment,
                    subject: activeSubject,
                    section: activeSection,
                    type: activeTab
                }));
    
                setAssessments({
                    ...assessments,
                    [activeTab]: [
                        ...assessments[activeTab],
                        ...assessmentsWithContext
                    ]
                });
            },
            setStudents,
            activeSubject,
            activeSection,
            activeTab
        )
            .then(() => {
                alert("Successfully imported!");
            })
            .catch((error) => {
                console.error("Error during import:", error);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    // Handle export of Excel file
    const handleExport = () => {
        setIsLoading(true);
        createExcelExport(getCurrentAssessments(), students, activeSubject, activeTab);
        setIsLoading(false);
    };

    // Toggle import help panel
    const toggleImportHelp = () => {
        setShowImportHelp(!showImportHelp);
    };

    // Add a new assessment
    const addAssessment = () => {
        if (!newAssessment.weightage || !newAssessment.total) {
            alert('Weightage and Total Marks are required');
            return;
        }

        const currentAssessments = getCurrentAssessments();
        const newId = currentAssessments.length > 0
            ? Math.max(...currentAssessments.map(a => a.id)) + 1
            : 1;

        setAssessments({
            ...assessments,
            [activeTab]: [
                ...assessments[activeTab],
                {
                    id: newId,
                    weightage: parseInt(newAssessment.weightage),
                    total: parseInt(newAssessment.total),
                    avg: 0,
                    status: 'Draft',
                    modified: false,
                    subject: activeSubject, // Add active subject
                    section: activeSection // Add active section
                }
            ]
        });

        // Reset form
        setNewAssessment({ weightage: 15, total: 15 });
        setShowAddForm(false);
    };

    // Delete an assessment
    const deleteAssessment = (id) => {
        setAssessments({
            ...assessments,
            [activeTab]: assessments[activeTab].filter(assessment => assessment.id !== id)
        });

        if (showStudentMarks && selectedAssessment && selectedAssessment.id === id) {
            setShowStudentMarks(false);
        }
    };

    // Toggle assessment status
    const toggleStatus = (id) => {
        setAssessments({
            ...assessments,
            [activeTab]: assessments[activeTab].map(assessment => {
                if (assessment.id === id) {
                    let newStatus;
                    if (assessment.status === 'Published') {
                        newStatus = 'Unpublished';
                    } else if (assessment.status === 'Modified' || assessment.status === 'Draft' || assessment.status === 'Unpublished') {
                        newStatus = 'Published';
                    }

                    return {
                        ...assessment,
                        status: newStatus,
                        modified: false // Reset modified flag when explicitly changing status
                    };
                }
                return assessment;
            })
        });
    };

    // Handle showing the add assessment form
    const handleAddClick = () => {
        // Set default weightage based on assessment type
        let defaultWeightage = 15;
        if (activeTab === 'Finals') defaultWeightage = 40;
        else if (activeTab === 'Midterms') defaultWeightage = 25;
        else if (activeTab === 'Assignments') defaultWeightage = 20;

        setNewAssessment({ weightage: defaultWeightage, total: 15 });
        setShowAddForm(true);
    };

    // Handle tab change
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setShowStudentMarks(false); // Hide student view when changing tabs
    };

    // Loader component
    const Loader = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-red-700"></div>
                <span className="text-gray-700">Processing...</span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col items-center py-6 px-4">
            {isLoading && <Loader />}
            <div className="w-full max-w-5xl bg-white rounded-lg shadow-md">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-bold text-gray-800">Teacher Marks Management</h1>
                        <button
                            className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-colors flex items-center gap-2"
                            onClick={handleAddClick}
                        >
                            + Add {activeTab.slice(0, -1)}
                        </button>
                    </div>

                    {/* Subject filters */}
                    <div className="flex flex-wrap gap-2 mb-4">
                        {subjects.map(subject => (
                            <button
                                key={subject}
                                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${activeSubject === subject
                                        ? 'bg-red-700 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                onClick={() => setActiveSubject(subject)}
                            >
                                {subject}
                            </button>
                        ))}
                    </div>

                    {/* Section filters */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {sections.map(section => (
                            <button
                                key={section}
                                className={`px-3 py-1.5 rounded-md text-sm transition-colors ${activeSection === section
                                        ? 'bg-red-700 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                onClick={() => setActiveSection(section)}
                            >
                                {section}
                            </button>
                        ))}
                    </div>

                    {/* Import/Export buttons */}
                    <div className="flex justify-end gap-3 mb-2">
                        <div className="relative flex items-center gap-2">
                            <label className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-2 cursor-pointer text-sm">
                                <Upload size={16} />
                                Import
                                <input
                                    type="file"
                                    accept=".xlsx,.xls"
                                    className="hidden"
                                    onChange={handleImport}
                                />
                            </label>
                            <button
                                className="text-gray-500 hover:text-blue-600"
                                onClick={toggleImportHelp}
                                title="Import Format Help"
                            >
                                <Info size={16} />
                            </button>
                        </div>
                        <button
                            className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm"
                            onClick={handleExport}
                        >
                            <Download size={16} />
                            Export
                        </button>
                    </div>

                    {/* Import Format Help Panel */}
                    {showImportHelp && (
                        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium text-blue-800">Excel Import Format</h3>
                                <button
                                    className="text-gray-500 hover:text-gray-700"
                                    onClick={toggleImportHelp}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <p className="text-sm text-gray-700 mb-3">
                                Your Excel file must include the following columns with the exact names:
                            </p>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white border border-blue-200 text-sm">
                                    <thead>
                                        <tr className="bg-blue-100">
                                            <th className="px-3 py-2 text-left border-b border-blue-200">Column Name</th>
                                            <th className="px-3 py-2 text-left border-b border-blue-200">Data Type</th>
                                            <th className="px-3 py-2 text-left border-b border-blue-200">Description</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requiredColumns.map((column, index) => (
                                            <tr key={index} className="border-b border-blue-100">
                                                <td className="px-3 py-2 font-medium">{column.name}</td>
                                                <td className="px-3 py-2">{column.type}</td>
                                                <td className="px-3 py-2">{column.description}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-3 text-sm text-gray-600">
                                <p>Example row: <span className="font-mono bg-blue-100 px-1 rounded">1, 15, 20, 101, "John Doe", 18</span></p>
                                <p className="mt-2 text-xs italic">All column names are case-sensitive. Make sure the first row of your Excel file contains these exact column names.</p>
                            </div>
                            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle size={16} className="mt-0.5" />
                                    <div>
                                        <p className="font-medium">Important Note</p>
                                        <p>Imported assessments will be associated with the currently active tab. Make sure you have the correct tab selected before importing.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Assessment type tabs */}
                    <div className="border-b border-gray-200 mb-4">
                        <div className="flex flex-wrap">
                            {tabs.map(tab => (
                                <button
                                    key={tab}
                                    className={`py-2 px-4 text-sm transition-colors ${activeTab === tab
                                            ? 'text-red-700 border-b-2 border-red-700 font-medium'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                    onClick={() => handleTabChange(tab)}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Add Assessment Form */}
                    {showAddForm && (
                        <div className="bg-gray-50 p-4 rounded-lg mb-6">
                            <h3 className="font-medium mb-3">Add New {activeTab.slice(0, -1)}</h3>
                            <div className="flex flex-wrap gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Weightage (%)</label>
                                    <input
                                        type="number"
                                        value={newAssessment.weightage}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, weightage: e.target.value })}
                                        className="w-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                                    <input
                                        type="number"
                                        value={newAssessment.total}
                                        onChange={(e) => setNewAssessment({ ...newAssessment, total: e.target.value })}
                                        className="w-32 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    className="px-4 py-2 bg-red-700 text-white rounded hover:bg-red-800 transition-colors"
                                    onClick={addAssessment}
                                >
                                    Add {activeTab.slice(0, -1)}
                                </button>
                                <button
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                    onClick={() => setShowAddForm(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Assessment list or Student marks view */}
                    {!showStudentMarks ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            #
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Weightage
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Avg
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {getCurrentAssessments().length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                                                No {activeTab.toLowerCase()} found for {activeSubject} ({activeSection}). Click the "+ Add {activeTab.slice(0, -1)}" button to add one.
                                            </td>
                                        </tr>
                                    ) : (
                                        getCurrentAssessments().map((assessment) => (
                                            <tr
                                                key={assessment.id}
                                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                                                onClick={() => handleAssessmentClick(assessment)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {assessment.id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {assessment.weightage}%
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {assessment.total}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {assessment.avg}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${assessment.status === 'Published' ? 'bg-green-100 text-green-800' :
                                                            assessment.status === 'Modified' ? 'bg-yellow-100 text-yellow-800' :
                                                                assessment.status === 'Draft' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {assessment.status}
                                                        {assessment.modified && (
                                                            <AlertTriangle size={12} className="ml-1 text-yellow-600" />
                                                        )}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                    <button
                                                        className="text-gray-600 hover:text-gray-900 bg-gray-100 px-3 py-1 rounded flex items-center gap-1 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleAssessmentClick(assessment);
                                                        }}
                                                    >
                                                        <Edit size={14} /> Edit
                                                    </button>
                                                    <button
                                                        className={`${assessment.status === 'Published' ? 'text-red-600 bg-red-50' :
                                                                'text-green-600 bg-green-50'
                                                            } hover:bg-opacity-80 px-3 py-1 rounded transition-colors`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleStatus(assessment.id);
                                                        }}
                                                    >
                                                        {assessment.status === 'Published' ? 'Unpublish' : 'Publish'}
                                                    </button>
                                                    <button
                                                        className="text-gray-500 hover:text-red-500 transition-colors"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteAssessment(assessment.id);
                                                        }}
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <StudentMarksView
                            assessment={selectedAssessment}
                            students={students}
                            activeTab={activeTab}
                            onBack={() => setShowStudentMarks(false)}
                            onUpdate={(updatedAssessment) => updateAssessment(updatedAssessment)}
                            onUpdateStudents={setStudents}
                            onToggleStatus={toggleStatus}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherMarksManagement;