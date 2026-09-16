const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'HR', 'PostEdit.jsx');
const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

const returnStartIndex = lines.findIndex((line, index) => line.trim() === 'return (' && lines[index+1].includes('className="bg-white rounded-2xl'));

if (returnStartIndex === -1) {
    console.error("Could not find start of return statement");
    process.exit(1);
}

// Find the end of the component export
let componentEndIndex = lines.length - 1;
for (let i = lines.length - 1; i >= 0; i--) {
    if (lines[i].includes('export default PostEdit;')) {
        componentEndIndex = i - 1;
        break;
    }
}

const newRender = `  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 max-w-[1400px] mx-auto mt-6 overflow-hidden flex flex-col" style={{ height: '85vh' }}>
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-gray-100 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Edit Post</h1>
        <p className="text-gray-500 text-sm">Update the details of your job or internship posting below.</p>
      </div>

      {loading ? (
        <div className="p-8">
          <Skeleton active paragraph={{ rows: 10 }} />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar / Tabs */}
          <aside className="w-80 bg-gray-50/50 border-r border-gray-100 flex-shrink-0 overflow-y-auto no-scrollbar p-6">
            <div className="space-y-2">
              {editOptions.map((item) => {
                const isActive = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    className={\`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-200 text-left \${
                      isActive 
                        ? "bg-white shadow-sm border border-[#5f2eea]/20 text-[#5f2eea]" 
                        : "text-gray-600 hover:bg-gray-100 border border-transparent hover:text-gray-900"
                    }\`}
                  >
                    <div className={\`flex items-center justify-center w-10 h-10 rounded-lg \${isActive ? "bg-[#5f2eea]/10" : "bg-white shadow-sm border border-gray-100"}\`}>
                      <span style={{ color: isActive ? "#5f2eea" : item.color, fontSize: '18px' }}>
                        {item.icon}
                      </span>
                    </div>
                    <div>
                      <h3 className={\`font-medium text-sm \${isActive ? "text-[#5f2eea]" : "text-gray-900"}\`}>{item.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{item.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-white p-8 custom-scrollbar relative">
            <div className="max-w-4xl mx-auto">
              <Form layout="vertical" className="space-y-6">
                {renderDrawerContent()}
              </Form>
            </div>
          </main>
        </div>
      )}
    </div>
  );`;

const newLines = [
    ...lines.slice(0, returnStartIndex),
    newRender,
    ...lines.slice(componentEndIndex)
];

fs.writeFileSync(filePath, newLines.join('\n'));
console.log("Successfully replaced return statement");
