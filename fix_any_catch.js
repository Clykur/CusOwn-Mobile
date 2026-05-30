const path = require('path');
const { Project, SyntaxKind } = require('ts-morph');

const project = new Project({
  tsConfigFilePath: path.join(__dirname, 'tsconfig.json'),
  skipAddingFilesFromTsConfig: true,
});

project.addSourceFilesAtPaths('src/**/*.ts');
project.addSourceFilesAtPaths('src/**/*.tsx');

let anyCount = 0;

for (const sourceFile of project.getSourceFiles()) {
  let fileChanged = false;

  sourceFile.getDescendantsOfKind(SyntaxKind.CatchClause).forEach((catchClause) => {
    const varDecl = catchClause.getVariableDeclaration();
    if (varDecl && varDecl.getTypeNode() && varDecl.getTypeNode().getText() === 'any') {
      varDecl.removeType();

      const catchBlock = catchClause.getBlock();
      const varName = varDecl.getName();

      catchBlock.getDescendantsOfKind(SyntaxKind.PropertyAccessExpression).forEach((pae) => {
        if (pae.getExpression().getText() === varName && pae.getName() === 'message') {
          pae.replaceWithText(
            `(${varName} instanceof Error ? ${varName}.message : String(${varName}))`,
          );
        }
      });
      fileChanged = true;
      anyCount++;
    }
  });

  if (fileChanged) {
    sourceFile.saveSync();
  }
}
console.log(`Catch blocks fixed: ${anyCount}`);
