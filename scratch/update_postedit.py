import re

file_path = r"c:\Users\dell\Documents\Careerfast\careerfast-frontend\src\HR\PostEdit.jsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

active_class = 'flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-[#5f2eea] text-white border-[#5f2eea] shadow-md'
inactive_class = 'flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-white text-gray-700 border-gray-200 hover:border-[#5f2eea] hover:text-[#5f2eea] hover:bg-[#5f2eea]/5'

button_replacements = [
    ("job_nature_button_active", active_class),
    ("job_nature_button", inactive_class),
    ("internship_duration_button_active", active_class),
    ("internship_duration_button", inactive_class),
    ("weeks_button_active", active_class),
    ("weeks_button", inactive_class),
    ("work_type_button_active", active_class),
    ("work_type_button", inactive_class),
    ("work_location_button_active", active_class),
    ("work_location_button", inactive_class),
    ("experience_required_button_active", active_class),
    ("experience_required_button", inactive_class),
    ("fresher_pass_button_active", active_class),
    ("fresher_pass_button", inactive_class),
]

# Note: order matters, replace exact strings. We'll use word boundaries or exact quotes.
for old, new in button_replacements:
    content = content.replace(f'"{old}"', f'"{new}"')
    content = content.replace(f"'{old}'", f'"{new}"')

container_replacements = [
    ('className="job_nature"', 'className="flex flex-wrap gap-3"'),
    ('className="work_type"', 'className="flex flex-wrap gap-3"'),
    ('className="basicdetails_edit"', 'className="space-y-6 max-w-3xl animate-fadeIn"'),
    ('className="salary_details"', 'className="space-y-6 max-w-3xl animate-fadeIn"'),
    ('className="eligibility"', 'className="space-y-6 max-w-3xl animate-fadeIn mt-8"'),
    ('className="experience_required"', 'className="space-y-3"'),
    ('className="other_benifits"', 'className="space-y-4 mt-8"'),
]

for old, new in container_replacements:
    content = content.replace(old, new)

# Update standard buttons
content = content.replace(
    'className="account_settings"', 
    'className="bg-[#5f2eea] hover:bg-[#4d26bd] h-10 px-8 text-base font-medium rounded-lg border-0 shadow-sm"'
)

# Also wrap the form groups for consistent spacing
content = content.replace('className="form-group"', 'className="mb-5"')
content = content.replace('className="from-group"', 'className="mb-5"')

# Add standard padding/bg to the whole content area
# Wait, renderDrawerContent returns are just the active case without a wrapper, so the wrapper is in main.
# <main className="flex-1 overflow-y-auto bg-white p-8 custom-scrollbar relative">
# The `max-w-4xl mx-auto` wrapper is already there.

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done replacing classes.")
