const fs = require('fs');
const path = require('path');

// Fix TestResultUpload.test.tsx
const testFile = path.join(__dirname, 'components/TestResults/TestResultUpload.test.tsx');
let content = fs.readFileSync(testFile, 'utf8');

// Fix all remaining label issues
content = content.replace(/getByLabelText\('Test Name'\)/g, "getByLabelText('Test Name *')");
content = content.replace(/getByLabelText\('Upload PDF File'\)/g, "getByLabelText('PDF Report *')");
content = content.replace(/getByLabelText\('Test Type'\)/g, "getByLabelText('Test Type *')");

// Fix error message expectations
content = content.replace(/getByText\('Please upload a PDF file only'\)/g, "getByText('Please select a PDF file only.')");
content = content.replace(/getByText\('File size must be less than 10MB'\)/g, "getByText('File size must be less than 10MB.')");

// Fix multiple "Upload Test Result" text issues by using more specific selectors
content = content.replace(
  /expect\(screen\.getByText\('Upload Test Result'\)\)\.toBeInTheDocument\(\)/g,
  "expect(screen.getByRole('heading', { name: 'Upload Test Result' })).toBeInTheDocument()"
);

fs.writeFileSync(testFile, content);
console.log('Fixed TestResultUpload.test.tsx');
