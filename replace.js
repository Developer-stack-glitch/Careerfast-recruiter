const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, 'src', 'Courses', 'CourseSingle.js');
const cssPath = path.join(__dirname, 'src', 'css', 'CourseSingle.css');

let jsContent = fs.readFileSync(jsPath, 'utf8');

// The block to replace in JS
const newJsBlock = `                {/* Exam & Certification Pro Section */}
                <section className="pro-cert-section" id="certification">
                    <div className="pro-cert-container">
                        <div className="pro-cert-left">
                            <div className="pro-cert-header">
                                <h2 className="pro-cert-title">Exam & <span className="highlight-gradient">Java Certification</span></h2>
                                <p className="pro-cert-subtitle">Validate your skills and accelerate your career with our industry-recognized certification.</p>
                            </div>

                            <div className="pro-cert-faq-list">
                                {[
                                    { q: "What are the prerequisites for Java Certification?", a: "Basic understanding of programming concepts and Java syntax is recommended." },
                                    { q: "What are the advantages of obtaining a Java Certification?", a: "It validates your skills, increases your earning potential, and gives you a competitive edge in the job market." },
                                    { q: "Does Java Certification guarantee employment?", a: "While it doesn't guarantee a job, it significantly improves your chances of being shortlisted for interviews." },
                                    { q: "How does Java Certification contribute to career growth?", a: "It opens doors to advanced roles like Senior Developer, Architect, or Team Lead." },
                                    { q: "What job roles can I pursue with a Java Certification?", a: "You can pursue roles such as Java Developer, Backend Engineer, Full Stack Developer, and Software Engineer." }
                                ].map((item, i) => (
                                    <div key={i} className={\`pro-cert-faq-item \${openCertFaqIndex === i ? 'open' : ''}\`}>
                                        <div
                                            className="pro-cert-faq-question"
                                            onClick={() => setOpenCertFaqIndex(openCertFaqIndex === i ? null : i)}
                                        >
                                            <div className="pro-cert-q-flex">
                                                <div className="pro-cert-q-icon">
                                                    <FaCheckCircle className={openCertFaqIndex === i ? "active-icon" : "inactive-icon"} />
                                                </div>
                                                <span className="pro-cert-q-text">{item.q}</span>
                                            </div>
                                            <div className="pro-cert-faq-chevron">
                                                <FaChevronDown className={openCertFaqIndex === i ? "rotated" : ""} />
                                            </div>
                                        </div>
                                        <AnimatePresence>
                                            {openCertFaqIndex === i && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: "auto", opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="pro-cert-faq-answer"
                                                >
                                                    <div className="pro-cert-faq-answer-inner">
                                                        <p>{item.a}</p>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>

                            <div className="pro-cert-action-btns">
                                <button className="btn-pro-primary">
                                    <FaAward className="btn-icon" /> GET CERTIFICATION
                                </button>
                                <button className="btn-pro-secondary">
                                    <FaGraduationCap className="btn-icon" /> START LEARNING
                                </button>
                            </div>
                        </div>

                        <div className="pro-cert-right">
                            <motion.div 
                                className="pro-cert-image-wrapper"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="pro-cert-badge-floating">
                                    <img src="https://cdn-icons-png.flaticon.com/512/5968/5968282.png" alt="Java" className="tech-badge" />
                                    <span>Official Certification</span>
                                </div>
                                <img src="https://img.freepik.com/free-vector/elegant-certificate-template-design_1017-17060.jpg" alt="CareerFast Certification" className="pro-cert-img" />
                            </motion.div>
                            
                            <div className="pro-cert-slider-wrapper">
                                <div className="pro-cert-slider-controls">
                                    <button className="pro-cert-slider-btn prev">
                                        <FaChevronLeft />
                                    </button>
                                    <div className="pro-cert-slider-text">
                                        <h4>Placement Complete Certification</h4>
                                        <span>Industry recognized certificate</span>
                                    </div>
                                    <button className="pro-cert-slider-btn next">
                                        <FaChevronRight />
                                    </button>
                                </div>
                                <div className="pro-cert-slider-dots">
                                    <span className="dot active"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>`;

// Replace old exam cert section with new
const startStr = '{/* Exam & Certification Section */}';
const endStr = '{/* Comparison Section (From User Image) */}';
const startIndex = jsContent.indexOf(startStr);
const endIndex = jsContent.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
    jsContent = jsContent.substring(0, startIndex) + newJsBlock + '\n\n                ' + jsContent.substring(endIndex);
    console.log('Successfully replaced JS block.');
} else {
    console.log('Could not find JS block to replace.');
}

// Ensure the new icons are imported
const iconImportRegex = /import\s+\{([^}]+)\}\s+from\s+["']react-icons\/fa["']/;
const match = jsContent.match(iconImportRegex);
if (match) {
    let importedIcons = match[1].split(',').map(i => i.trim()).filter(i => i);
    const newIcons = ['FaChevronDown', 'FaChevronRight', 'FaChevronLeft', 'FaAward', 'FaGraduationCap'];
    let added = false;
    newIcons.forEach(icon => {
        if (!importedIcons.includes(icon)) {
            importedIcons.push(icon);
            added = true;
        }
    });
    
    if (added) {
        const newImportStr = \`import {
    \${importedIcons.join(',\\n    ')}
} from "react-icons/fa"\`;
        jsContent = jsContent.replace(iconImportRegex, newImportStr);
        console.log('Updated react-icons imports.');
    }
}

fs.writeFileSync(jsPath, jsContent);


// Update CSS
let cssContent = fs.readFileSync(cssPath, 'utf8');

const newCssBlock = \`/* Exam & Certification Pro Section Redesign */
.pro-cert-section {
  padding: 80px 0;
  background-color: #ffffff;
  position: relative;
  overflow: hidden;
}

.pro-cert-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, transparent 70%);
  border-radius: 50%;
  z-index: 0;
}

.pro-cert-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  gap: 60px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.pro-cert-left {
  flex: 1.1;
}

.pro-cert-header {
  margin-bottom: 40px;
}

.pro-cert-title {
  font-size: 42px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 15px;
  line-height: 1.2;
  letter-spacing: -1px;
}

.highlight-gradient {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.pro-cert-subtitle {
  font-size: 18px;
  color: #64748b;
  line-height: 1.6;
}

.pro-cert-faq-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
}

.pro-cert-faq-item {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.pro-cert-faq-item:hover {
  border-color: #cbd5e1;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.05);
}

.pro-cert-faq-item.open {
  border-color: #818cf8;
  box-shadow: 0 10px 25px rgba(99, 102, 241, 0.1);
}

.pro-cert-faq-question {
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  background: #ffffff;
}

.pro-cert-q-flex {
  display: flex;
  align-items: center;
  gap: 15px;
}

.pro-cert-q-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.active-icon {
  color: #4f46e5;
}

.inactive-icon {
  color: #cbd5e1;
}

.pro-cert-q-text {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  line-height: 1.5;
}

.pro-cert-faq-item.open .pro-cert-q-text {
  color: #4f46e5;
}

.pro-cert-faq-chevron {
  color: #94a3b8;
  font-size: 14px;
  transition: transform 0.3s ease;
  display: flex;
  align-items: center;
}

.pro-cert-faq-chevron .rotated {
  transform: rotate(180deg);
  color: #4f46e5;
}

.pro-cert-faq-answer {
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
}

.pro-cert-faq-answer-inner {
  padding: 20px 24px 24px 50px;
  font-size: 15px;
  color: #475569;
  line-height: 1.7;
}

.pro-cert-action-btns {
  display: flex;
  gap: 20px;
}

.btn-pro-primary {
  background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%);
  color: #ffffff;
  border: none;
  padding: 14px 28px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 20px rgba(79, 70, 229, 0.25);
  transition: all 0.3s ease;
}

.btn-pro-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 25px rgba(79, 70, 229, 0.35);
}

.btn-pro-secondary {
  background: #ffffff;
  color: #4f46e5;
  border: 2px solid #e0e7ff;
  padding: 14px 28px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: all 0.3s ease;
}

.btn-pro-secondary:hover {
  border-color: #4f46e5;
  background: #f5f8ff;
  color: #4338ca;
}

.btn-icon {
  font-size: 18px;
}

/* Right Side - Image and Slider */
.pro-cert-right {
  flex: 0.9;
  position: relative;
}

.pro-cert-image-wrapper {
  position: relative;
  background: #ffffff;
  border-radius: 20px;
  padding: 15px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
  border: 1px solid #f1f5f9;
  margin-bottom: 30px;
}

.pro-cert-image-wrapper::before {
  content: '';
  position: absolute;
  top: -10px;
  right: -10px;
  bottom: -10px;
  left: -10px;
  background: linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%);
  border-radius: 24px;
  z-index: -1;
  opacity: 0.5;
}

.pro-cert-img {
  width: 100%;
  height: auto;
  border-radius: 12px;
  display: block;
}

.pro-cert-badge-floating {
  position: absolute;
  top: -20px;
  left: -20px;
  background: #ffffff;
  padding: 12px 20px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  border: 1px solid #f1f5f9;
  z-index: 2;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.tech-badge {
  width: 32px;
  height: 32px;
}

.pro-cert-badge-floating span {
  font-weight: 700;
  color: #1e293b;
  font-size: 14px;
}

.pro-cert-slider-wrapper {
  background: #ffffff;
  border-radius: 16px;
  padding: 20px 25px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.pro-cert-slider-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15px;
}

.pro-cert-slider-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 16px;
}

.pro-cert-slider-btn:hover {
  background: #4f46e5;
  color: #ffffff;
  border-color: #4f46e5;
  transform: scale(1.05);
}

.pro-cert-slider-text {
  text-align: center;
}

.pro-cert-slider-text h4 {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 4px;
}

.pro-cert-slider-text span {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.pro-cert-slider-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.pro-cert-slider-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #cbd5e1;
  transition: all 0.3s ease;
}

.pro-cert-slider-dots .dot.active {
  background: #4f46e5;
  width: 24px;
  border-radius: 4px;
}

@media (max-width: 1024px) {
  .pro-cert-container {
    flex-direction: column;
    gap: 50px;
  }
  .pro-cert-left, .pro-cert-right {
    width: 100%;
    flex: unset;
  }
  .pro-cert-title {
    font-size: 36px;
  }
}
\`;

// Replace old exam CSS with new
const oldCssStart = '.exam-cert-section {';
const oldCssStartIndex = cssContent.indexOf(oldCssStart);

if (oldCssStartIndex !== -1) {
    // remove everything from .exam-cert-section { to the end of the file or up to the next major section
    cssContent = cssContent.substring(0, oldCssStartIndex);
    cssContent += newCssBlock;
    console.log('Replaced old exam cert css with new.');
} else {
    // just append
    cssContent += '\\n\\n' + newCssBlock;
    console.log('Appended new exam cert css.');
}

fs.writeFileSync(cssPath, cssContent);
console.log('Done modifying CSS.');
