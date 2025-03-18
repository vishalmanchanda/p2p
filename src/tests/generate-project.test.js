const fs = require('fs');
const path = require('path');
const os = require('os');
const { generateProject } = require('../services/generate-project');
const rimraf = require('rimraf');

describe('generateProject', () => {
  let tempDir;
  let projectPath;
  const projectName = 'test-project';
  const sampleRequirements = 'Entity User { name: string, email: string, age: number }';

  beforeEach(() => {
    // Create a temporary directory for testing
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'project-test-'));
    // Change current working directory to the temp directory
    process.chdir(tempDir);
  });

  afterEach(() => {
    // Clean up the temporary directory after tests
    rimraf.sync(tempDir);
  });

  test('should create project with correct structure', () => {
    // Generate a test project
    projectPath = generateProject(projectName, sampleRequirements);

    // Verify project directory was created
    expect(fs.existsSync(projectPath)).toBe(true);

    // Verify subdirectories were created
    expect(fs.existsSync(path.join(projectPath, 'db'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'static'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'requirements'))).toBe(true);

    // Verify files were created
    expect(fs.existsSync(path.join(projectPath, 'requirements', 'requirements.txt'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'db', 'db.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'static', 'entity-configs.js'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'start.sh'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'start.bat'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
    expect(fs.existsSync(path.join(projectPath, 'README.md'))).toBe(true);

    // Verify requirements.txt content
    const requirementsContent = fs.readFileSync(
      path.join(projectPath, 'requirements', 'requirements.txt'),
      'utf8'
    );
    expect(requirementsContent).toBe(sampleRequirements);

    // Verify package.json content
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(projectPath, 'package.json'), 'utf8')
    );
    expect(packageJson.name).toBe(projectName);
    expect(packageJson.scripts).toHaveProperty('start');

    // Verify start scripts contain correct commands
    const startShContent = fs.readFileSync(path.join(projectPath, 'start.sh'), 'utf8');
    expect(startShContent).toContain('npx json-server --watch db/db.json --port 3002 -s static');

    const startBatContent = fs.readFileSync(path.join(projectPath, 'start.bat'), 'utf8');
    expect(startBatContent).toContain('npx json-server --watch db/db.json --port 3002 -s static');
  });

  test('should handle empty requirements', () => {
    projectPath = generateProject(projectName);
    
    const requirementsContent = fs.readFileSync(
      path.join(projectPath, 'requirements', 'requirements.txt'),
      'utf8'
    );
    expect(requirementsContent).toBe('# Add your requirements here');
  });

  test('should warn if project directory already exists', () => {
    // Create the project directory first
    fs.mkdirSync(path.join(tempDir, projectName));
    
    // Spy on console.warn
    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    projectPath = generateProject(projectName);
    
    // Verify warning was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining(`Warning: Project directory ${projectName} already exists`)
    );
    
    consoleSpy.mockRestore();
  });
});