const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\dell\\Documents\\Careerfast\\careerfast-frontend\\src\\HR\\PostEdit.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Change renderDrawerContent to accept a parameter
content = content.replace(
    'const renderDrawerContent = () => {',
    'const renderDrawerContent = (sectionKey) => {'
);
content = content.replace(
    'switch (activeSection) {',
    'switch (sectionKey) {'
);

// 2. Replace the main return block
const oldReturnStart = '  return (\n    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-[1400px] mx-auto mt-6 overflow-hidden flex flex-col" style={{ height: \'85vh\' }}>';
// We'll just regex replace from "  return (" to the end of the file.

const newReturn = `  return (
    <div className="bg-gray-50 min-h-screen pb-12">
      {/* Header */}
      <div className="bg-white px-8 py-8 border-b border-gray-200 sticky top-0 z-10 shadow-sm flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Job Post</h1>
          <p className="text-gray-500 text-base">Update your job or internship details comprehensively.</p>
        </div>
      </div>

      {loading ? (
        <div className="p-8 max-w-4xl mx-auto mt-8 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Skeleton active paragraph={{ rows: 15 }} />
        </div>
      ) : (
        <div className="max-w-4xl mx-auto mt-8 px-4">
          <Form layout="vertical" className="space-y-8">
            {/* Basic Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#13c2c2]/10 flex items-center justify-center text-[#13c2c2] text-xl">
                  <ProfileOutlined />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Job Basics & Requirements</h2>
              </div>
              {renderDrawerContent("basic")}
            </div>

            {/* Process Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#fa8c16]/10 flex items-center justify-center text-[#fa8c16] text-xl">
                  <SolutionOutlined />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Work Mode & Requirements</h2>
              </div>
              {renderDrawerContent("process")}
            </div>

            {/* Salary Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#eb2f96]/10 flex items-center justify-center text-[#eb2f96] text-xl">
                  <FileTextOutlined />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Salary & Compensation</h2>
              </div>
              {renderDrawerContent("description")}
            </div>

            {/* Additional Info Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-3 border-b border-gray-100 pb-4 mb-6">
                <div className="w-10 h-10 rounded-full bg-[#1d39c4]/10 flex items-center justify-center text-[#1d39c4] text-xl">
                  <PlusCircleOutlined />
                </div>
                <h2 className="text-2xl font-bold text-gray-800">Job Description & Additional Info</h2>
              </div>
              {renderDrawerContent("additionalinformation")}
            </div>
          </Form>
        </div>
      )}
    </div>
  );
};

export default PostEdit;
`;

const returnIndex = content.indexOf(oldReturnStart);
if (returnIndex !== -1) {
    content = content.substring(0, returnIndex) + newReturn;
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Successfully updated layout");
} else {
    console.log("Could not find the return block.");
}
