const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');

const project = new Project({
  tsConfigFilePath: path.join(__dirname, 'tsconfig.json'),
  skipAddingFilesFromTsConfig: true,
});

project.addSourceFilesAtPaths('src/**/*.ts');
project.addSourceFilesAtPaths('src/**/*.tsx');

let anyCount = 0;

for (const sourceFile of project.getSourceFiles()) {
  let fileChanged = false;

  // Fix Catch Clauses: catch(err: any)
  sourceFile.getDescendantsOfKind(SyntaxKind.CatchClause).forEach((catchClause) => {
    const varDecl = catchClause.getVariableDeclaration();
    if (varDecl && varDecl.getTypeNode() && varDecl.getTypeNode().getText() === 'any') {
      varDecl.removeType(); // catch(err) implicitly has unknown in strict mode or any, but removing explicit any helps

      // Now we need to fix any err.message usages
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

  // Fix explicit Type References: : any
  sourceFile.getDescendantsOfKind(SyntaxKind.AnyKeyword).forEach((anyKeyword) => {
    const parent = anyKeyword.getParent();

    // Function parameters (e.g. filters?: any) -> Record<string, unknown>
    if (parent.isKind(SyntaxKind.Parameter)) {
      anyKeyword.replaceWithText('Record<string, unknown>');
      fileChanged = true;
      anyCount++;
    }
    // Type assertions (e.g. as any) -> as unknown
    else if (parent.isKind(SyntaxKind.AsExpression)) {
      anyKeyword.replaceWithText('unknown');
      fileChanged = true;
      anyCount++;
    }
    // Property Signatures or Variable Declarations -> unknown
    else if (
      parent.isKind(SyntaxKind.PropertySignature) ||
      parent.isKind(SyntaxKind.VariableDeclaration)
    ) {
      anyKeyword.replaceWithText('unknown');
      fileChanged = true;
      anyCount++;
    }
  });

  if (fileChanged) {
    sourceFile.saveSync();
    console.log(`Fixed any types in ${sourceFile.getBaseName()}`);
  }
}

console.log(`Total any references modified: ${anyCount}`);
