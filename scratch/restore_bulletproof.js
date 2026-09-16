const fs = require('fs');

const goodCode = `      case "process":
        return (
          <>
            <div style={{ marginTop: 15 }} className="mb-5">
              <Form.Item
                layout="vertical"
                label={<span style={{ fontWeight: 500 }}>Job Nature </span>}
              >
                <div className="flex flex-wrap gap-3">
                  {jobNatureOptions.map((item) => {
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={
                          jobNatureId === item.id
                            ? "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-[#5f2eea] text-white border-[#5f2eea] shadow-md"
                            : "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-white text-gray-700 border-gray-200 hover:border-[#5f2eea] hover:text-[#5f2eea] hover:bg-[#5f2eea]/5"
                        }
                        onClick={() => {
                          if (item.id === jobNatureId) {
                            return;
                          } else {
                            setJobNatureId(item.id);
                            if (item.id === 2) {
                              getDurationTypesData();
                            } else {
                              setInternshipDurationTypeData([]);
                            }
                          }
                        }}
                      >
                        {item.id === 1 ? (
                          <HiMiniComputerDesktop />
                        ) : item.id === 2 ? (
                          <MdOutlineEventNote />
                        ) : (
                          <TbContract />
                        )}{" "}
                        {item.name}
                      </button>
                    );
                  })}
                </div>
              </Form.Item>
            </div>

            <div style={{ marginTop: 15 }} className="mb-5">
              {jobNatureId === 2 && (
                <Form.Item
                  layout="vertical"
                  label={
                    <span style={{ fontWeight: 500 }}>
                      Internships Duration
                    </span>
                  }
                >
                  <div className="flex flex-wrap gap-3">
                    {internshipDurationTypeData.map((item) => {
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={
                            jobInternshipDuration === item.id
                              ? "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-[#5f2eea] text-white border-[#5f2eea] shadow-md"
                              : "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-white text-gray-700 border-gray-200 hover:border-[#5f2eea] hover:text-[#5f2eea] hover:bg-[#5f2eea]/5"
                          }
                          onClick={() => {
                            getDurationData(item.id);
                            setJobInternshipDuration(item.id);
                          }}
                        >
                          {item.name === "In Weeks" ? (
                            <HiMiniComputerDesktop />
                          ) : (
                            <HiMiniComputerDesktop />
                          )}{" "}
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </Form.Item>
              )}
            </div>

            <div style={{ marginTop: 15 }} className="mb-5">
              {jobNatureId === 2 && (
                <div className="flex flex-wrap gap-3">
                  {internShipDuration.map((item) => {
                    return (
                      <button
                        type="button"
                        key={item.id}
                        className={
                          selectedDurationId === item.id
                            ? "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-[#5f2eea] text-white border-[#5f2eea] shadow-md"
                            : "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-white text-gray-700 border-gray-200 hover:border-[#5f2eea] hover:text-[#5f2eea] hover:bg-[#5f2eea]/5"
                        }
                        onClick={() => {
                          setWeeksActiveButton(item.id);
                          setSelectedDurationId(item.id);
                        }}
                      >
                        {item.duration}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ marginTop: 15 }} className="mb-5">
              <div className="flex flex-wrap gap-3">
                <Form.Item
                  layout="vertical"
                  label={
                    <span style={{ fontWeight: 500 }}>Workplace Type</span>
                  }
                  style={{ marginBottom: "0px" }}
                >
                  <div className="flex flex-wrap gap-3">
                    {workplaceTypeData.map((item) => {
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={
                            workTypeActiveButton === item.id
                              ? "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-[#5f2eea] text-white border-[#5f2eea] shadow-md"
                              : "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-white text-gray-700 border-gray-200 hover:border-[#5f2eea] hover:text-[#5f2eea] hover:bg-[#5f2eea]/5"
                          }
                          onClick={() => {
                            if (item.id === 3 || item.id === 1) {
                              getWorkPlaceLocationData();
                            } else {
                              setWorkplaceLocation([]);
                            }
                            setWorkTypeActiveButton(item.id);
                            setWorkplaceType(item.id);
                          }}
                        >
                          <PiOfficeChairLight /> {item.name}
                        </button>
                      );
                    })}
                  </div>
                </Form.Item>
              </div>
            </div>

            <div style={{ marginTop: 15 }} className="mb-5">
              {workTypeActiveButton === 3 || workTypeActiveButton === 1 ? (
                <Form.Item
                  layout="vertical"
                  label={<span style={{ fontWeight: 500 }}>Work Location</span>}
                >
                  <div className="flex flex-wrap gap-3">
                    {workplaceLocation.map((item) => {
                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={
                            workLocationActiveButton === item.id
                              ? "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-[#5f2eea] text-white border-[#5f2eea] shadow-md"
                              : "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-white text-gray-700 border-gray-200 hover:border-[#5f2eea] hover:text-[#5f2eea] hover:bg-[#5f2eea]/5"
                          }
                          onClick={() => {
                            setWorkLocationActiveButton(item.id);
                            setWorkLocation(item.id);
                          }}
                        >
                          <PiOfficeChairLight /> {item.name}
                        </button>
                      );
                    })}
                  </div>

                  {workLocationActiveButton === 1 ? (
                    <CommonSelectField
                      style={{ marginTop: "20px" }}
                      showSearch={true}
                      mode="multiple"
                      placeholder={"Select location"}
                      value={specificLocation}
                      onChange={(value, option) => {
                        setSpecificLocation(value);
                      }}
                      options={workLocationOption}
                    />
                  ) : null}
                </Form.Item>
              ) : null}
            </div>
            <div style={{ marginTop: 20 }}>
              <Button
                onClick={handleSaveJobNature}
                className="bg-[#5f2eea] hover:bg-[#4d26bd] text-white h-10 px-8 text-base font-medium rounded-lg border-0 shadow-sm"
                type="primary"
              >
                Save Changes
              </Button>
            </div>
          </>
        );
      case "description":
        return (
          <>
            <div className="space-y-6 max-w-3xl animate-fadeIn">
              <h4>Salary Details</h4>
              <p>
                Add compensation details to filter better candidates and speed
                up the sourcing process.
              </p>
              <Form.Item
                layout="vertical"
                label={
                  <h5>
                    <span style={{ color: "red" }}>*</span> Salary Type{" "}
                  </h5>
                }
                name="salarytype"
              >
                <div>
                  <Alert
                    className="alert_message"
                    banner
                    message={\`Enter \${salaryDuration} Salary\`}
                  />
                  <div style={{ marginTop: 15, marginBottom: 15 }} className="salary_duration_toggle">
                    <div className="flex flex-wrap gap-3">
                      {["Annual", "Monthly"].map((type) => (
                        <button
                          key={type}
                          type="button"
                          className={salaryDuration === type ? "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-[#5f2eea] text-white border-[#5f2eea] shadow-md" : "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-white text-gray-700 border-gray-200 hover:border-[#5f2eea] hover:text-[#5f2eea] hover:bg-[#5f2eea]/5"}
                          onClick={() => setSalaryDuration(type)}
                        >
                          {type} Salary
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {salaryData.map((item) => {
                      return (
                        <button
                          key={item.id}
                          className={
                            salaryTypeActiveButton === item.id
                              ? "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-[#5f2eea] text-white border-[#5f2eea] shadow-md"
                              : "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-white text-gray-700 border-gray-200 hover:border-[#5f2eea] hover:text-[#5f2eea] hover:bg-[#5f2eea]/5"
                          }
                          onClick={() => {
                            setSalaryTypeActiveButton(item.id);
                          }}
                        >
                          {item.id === 1 ? (
                            <LuLocateFixed />
                          ) : item.id === 2 ? (
                            <RiEqualizerLine />
                          ) : (
                            <TbContract />
                          )}{" "}
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </Form.Item>

              {salaryTypeActiveButton === 1 && (
                <div className="salary_details_inner">
                  <h5>Salary Figure</h5>
                  <p>
                    The salary on the job page will be shown in {salaryDuration.toLowerCase()} only.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Select
                      showSearch
                      value={currency.code}
                      onChange={(code) =>
                        setCurrency({
                          code,
                          symbol: currencySymbol(code)
                        })
                      }
                      style={{ width: 150 }}
                    >
                      {currencyCodes.codes().map((code) => (
                        <Option key={code} value={code}>
                          {\`\${currencySymbol(code)} - \${code}\`}
                        </Option>
                      ))}
                    </Select>
                    <InputNumber
                      style={{ width: "60%", marginLeft: 12 }}
                      value={fixedSalary}
                      onChange={(value) => setFixedSalary(value)}
                      placeholder="Enter amount"
                      min={0}
                    />
                  </div>
                </div>
              )}

              {salaryTypeActiveButton === 2 && (
                <div className="salary_details_inner">
                  <h5>Salary Figure</h5>
                  <p>
                    The salary on the job page will be shown in {salaryDuration.toLowerCase()} only.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Select
                      showSearch
                      value={currency.code}
                      onChange={(code) =>
                        setCurrency({
                          code,
                          symbol: currencySymbol(code)
                        })
                      }
                      style={{ width: 150 }}
                    >
                      {currencyCodes.codes().map((code) => (
                        <Option key={code} value={code}>
                          {\`\${currencySymbol(code)} - \${code}\`}
                        </Option>
                      ))}
                    </Select>
                    <InputNumber
                      value={salaryMin}
                      onChange={(value) => setSalaryMin(value)}
                      placeholder="Min"
                      min={0}
                    />

                    <InputNumber
                      value={salaryMax}
                      onChange={(value) => setSalaryMax(value)}
                      placeholder="Max"
                      min={0}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6 max-w-3xl animate-fadeIn mt-8">
              <h4>Eligibility</h4>
              <p>
                Add the eligibility criteria to better filter the candidates.
              </p>
              <Alert
                style={{ marginBottom: 10, fontSize: 12, border: "none", borderRadius: 8 }}
                message="Select the eligibility criteria that will be displayed after saving."
                type="info"
                showIcon
              />
              <div style={{ paddingTop: 0 }} className="space-y-3">
                <p>
                  <span style={{ color: "red" }}>*</span> Experience Required
                  (In Years)
                </p>
                <div className="flex flex-wrap gap-3">
                  {eligibilityData.map((item) => {
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className={
                          experienceRequiredActiveButton === item.id
                            ? "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-[#5f2eea] text-white border-[#5f2eea] shadow-md"
                            : "flex items-center gap-2 px-5 py-2.5 rounded-full border transition-all duration-200 font-medium text-sm bg-white text-gray-700 border-gray-200 hover:border-[#5f2eea] hover:text-[#5f2eea] hover:bg-[#5f2eea]/5"
                        }
                        onClick={() => {
                          setExperienceRequiredActiveButton(item.id);
                          setEligibility(item.id);
                        }}
                      >
                        <FaPersonCircleExclamation /> {item.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                {experienceRequiredActiveButton === 1 ? (
                  <>
                    <p>Experience Required (In Years)</p>
                    <div className="flex flex-wrap gap-3">
                      {eligibilityYearData.map((item) => {`;

let file = fs.readFileSync('C:\\\\Users\\\\dell\\\\Documents\\\\Careerfast\\\\careerfast-frontend\\\\src\\\\HR\\\\PostEdit.jsx', 'utf8');

const startStr = '      case "process":';
const endStr = '                      {eligibilityYearData.map((item) => {';

const startIndex = file.indexOf(startStr);
const endIndex = file.indexOf(endStr, startIndex);

if (startIndex > -1 && endIndex > -1) {
    const actualEndIndex = endIndex + endStr.length;
    const newContent = file.substring(0, startIndex) + goodCode + file.substring(actualEndIndex);
    fs.writeFileSync('C:\\\\Users\\\\dell\\\\Documents\\\\Careerfast\\\\careerfast-frontend\\\\src\\\\HR\\\\PostEdit.jsx', newContent, 'utf8');
    console.log('Fully restored successfully');
} else {
    console.log('Search strings not found');
}
