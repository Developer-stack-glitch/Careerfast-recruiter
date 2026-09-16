const fs = require('fs'); let css = fs.readFileSync('src/css/CourseSingle.css', 'utf8').split('\n'); css.splice(2440, 108); fs.writeFileSync('src/css/CourseSingle.css', css.join('\n'));
