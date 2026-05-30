const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');

const project = new Project({
  tsConfigFilePath: 'tsconfig.json',
});

const styleMap = {
  marginTop: (v) => `mt-${v / 4}`,
  marginBottom: (v) => `mb-${v / 4}`,
  marginLeft: (v) => `ml-${v / 4}`,
  marginRight: (v) => `mr-${v / 4}`,
  marginHorizontal: (v) => `mx-${v / 4}`,
  marginVertical: (v) => `my-${v / 4}`,
  margin: (v) => `m-${v / 4}`,
  paddingTop: (v) => `pt-${v / 4}`,
  paddingBottom: (v) => `pb-${v / 4}`,
  paddingLeft: (v) => `pl-${v / 4}`,
  paddingRight: (v) => `pr-${v / 4}`,
  paddingHorizontal: (v) => `px-${v / 4}`,
  paddingVertical: (v) => `py-${v / 4}`,
  padding: (v) => `p-${v / 4}`,
  borderRadius: (v) => {
    if (v == 0) return 'rounded-none';
    if (v <= 2) return 'rounded-sm';
    if (v <= 4) return 'rounded';
    if (v <= 6) return 'rounded-md';
    if (v <= 8) return 'rounded-lg';
    if (v <= 10) return 'rounded-xl';
    if (v <= 12) return 'rounded-xl';
    if (v <= 16) return 'rounded-2xl';
    if (v <= 22) return 'rounded-3xl';
    if (v <= 24) return 'rounded-3xl';
    if (v <= 32) return 'rounded-3xl';
    return 'rounded-full';
  },
  borderTopLeftRadius: (v) => `rounded-tl-${v / 4}`,
  borderTopRightRadius: (v) => `rounded-tr-${v / 4}`,
  borderBottomLeftRadius: (v) => `rounded-bl-${v / 4}`,
  borderBottomRightRadius: (v) => `rounded-br-${v / 4}`,
  width: (v) => {
    if (typeof v === 'string' && v.includes('%')) return `w-${v === '100%' ? 'full' : `[${v}]`}`;
    if (v === 22 || v === 24) return 'w-6';
    if (v === 34) return 'w-8';
    return `w-${v / 4}`;
  },
  height: (v) => {
    if (typeof v === 'string' && v.includes('%')) return `h-${v === '100%' ? 'full' : `[${v}]`}`;
    if (v === 22 || v === 24) return 'h-6';
    if (v === 34) return 'h-8';
    if (v === 54) return 'h-14';
    if (v === 58) return 'h-14';
    return `h-${v / 4}`;
  },
  minHeight: (v) => {
    if (v === 72) return 'min-h-[72px]';
    if (v === 110) return 'min-h-[110px]';
    if (v === 320) return 'min-h-[320px]';
    return null;
  },
  maxHeight: (v) => {
    if (v === 220) return 'max-h-[220px]';
    if (typeof v === 'string' && v.includes('%'))
      return `max-h-${v === '100%' ? 'full' : `[${v}]`}`;
    return null;
  },
  fontSize: (v) => {
    if (v <= 12) return 'text-xs';
    if (v <= 14) return 'text-sm';
    if (v <= 16) return 'text-base';
    if (v <= 18) return 'text-lg';
    if (v <= 20) return 'text-xl';
    if (v <= 24) return 'text-2xl';
    if (v <= 26) return 'text-3xl';
    if (v <= 30) return 'text-3xl';
    return 'text-4xl';
  },
  fontWeight: (v) => {
    if (v == 'bold' || v == '700') return 'font-bold';
    if (v == '600') return 'font-semibold';
    if (v == '500') return 'font-medium';
    if (v == '800') return 'font-extrabold';
    if (v == '900') return 'font-black';
    return 'font-normal';
  },
  lineHeight: (v) => `leading-${Math.floor(v / 4)}`,
  letterSpacing: (v) => {
    if (v > 0) return 'tracking-wide';
    if (v < 0) return 'tracking-tighter';
    return 'tracking-normal';
  },
};

const stringMap = {
  flexDirection: { "'row'": 'flex-row', "'column'": 'flex-col' },
  alignItems: {
    "'center'": 'items-center',
    "'flex-start'": 'items-start',
    "'flex-end'": 'items-end',
  },
  justifyContent: {
    "'center'": 'justify-center',
    "'space-between'": 'justify-between',
    "'space-around'": 'justify-around',
    "'flex-start'": 'justify-start',
    "'flex-end'": 'justify-end',
  },
  flex: { 1: 'flex-1' },
  backgroundColor: {
    'THEME.colors.card': 'bg-card',
    'THEME.colors.background': 'bg-background',
    'THEME.colors.border': 'bg-border',
    'THEME.colors.primary': 'bg-primary',
    "'rgba(0, 0, 0, 0.7)'": 'bg-black/70',
    "'rgba(0,0,0,0.7)'": 'bg-black/70',
    "'transparent'": 'bg-transparent',
    "'#0B0B0B'": 'bg-[#0B0B0B]',
  },
  color: {
    'THEME.colors.text': 'text-text',
    'THEME.colors.primary': 'text-primary',
    'THEME.colors.textSecondary': 'text-textSecondary',
    '#fff': 'text-white',
  },
  textAlign: { "'center'": 'text-center', "'left'": 'text-left', "'right'": 'text-right' },
  position: { "'absolute'": 'absolute', "'relative'": 'relative' },
  textAlignVertical: { "'top'": 'align-top' },
};

function processSourceFile(sourceFile) {
  let changed = false;

  const jsxElements = [
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxOpeningElement),
    ...sourceFile.getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement),
  ];

  jsxElements.forEach((element) => {
    const styleAttr = element.getAttribute('style');
    if (!styleAttr || !styleAttr.isKind(SyntaxKind.JsxAttribute)) return;

    const initializer = styleAttr.getInitializer();
    if (!initializer || !initializer.isKind(SyntaxKind.JsxExpression)) return;

    const expr = initializer.getExpression();
    if (!expr || !expr.isKind(SyntaxKind.ObjectLiteralExpression)) return; // Only process inline object literal

    const newClasses = [];
    const propsToRemove = [];

    expr.getProperties().forEach((prop) => {
      if (prop.isKind(SyntaxKind.PropertyAssignment)) {
        const key = prop.getName();
        const init = prop.getInitializer();
        if (!init) return;

        let valText = init.getText();

        // 1. Try static map
        if (stringMap[key] && stringMap[key][valText]) {
          newClasses.push(stringMap[key][valText]);
          propsToRemove.push(prop);
          return;
        }

        // 2. Try numeric / calculated map
        if (styleMap[key]) {
          // If it's a numeric literal
          if (init.isKind(SyntaxKind.NumericLiteral)) {
            const val = init.getLiteralValue();
            const cls = styleMap[key](val);
            if (cls) {
              newClasses.push(cls);
              propsToRemove.push(prop);
              return;
            }
          }
          // If it's a string literal like '100%'
          if (init.isKind(SyntaxKind.StringLiteral)) {
            const val = init.getLiteralValue();
            const cls = styleMap[key](val);
            if (cls) {
              newClasses.push(cls);
              propsToRemove.push(prop);
              return;
            }
          }
          // Handle negative numbers: -12
          if (
            init.isKind(SyntaxKind.PrefixUnaryExpression) &&
            init.getOperatorToken() === SyntaxKind.MinusToken
          ) {
            const numText = init.getOperand().getText();
            const val = -parseFloat(numText);
            if (!isNaN(val)) {
              const cls = styleMap[key](val);
              if (cls) {
                newClasses.push(cls);
                propsToRemove.push(prop);
                return;
              }
            }
          }
        }
      }
    });

    if (newClasses.length > 0) {
      changed = true;

      // Add or update className
      let classNameAttr = element.getAttribute('className');
      if (classNameAttr && classNameAttr.isKind(SyntaxKind.JsxAttribute)) {
        const clsInit = classNameAttr.getInitializer();
        if (clsInit && clsInit.isKind(SyntaxKind.StringLiteral)) {
          const oldVal = clsInit.getLiteralValue();
          const merged = Array.from(new Set([...oldVal.split(' '), ...newClasses]))
            .filter(Boolean)
            .join(' ');
          clsInit.replaceWithText(`"${merged}"`);
        } else {
          console.log(
            `Skipped className merge for ${sourceFile.getFilePath()} due to JSX expression`,
          );
          return; // Abort removal for this element
        }
      } else {
        // Create new className attribute
        element.insertAttribute(0, {
          name: 'className',
          initializer: `"${newClasses.join(' ')}"`,
        });
      }

      // Remove the migrated props
      propsToRemove.forEach((p) => p.remove());

      // If style is now empty, remove it completely
      if (expr.getProperties().length === 0) {
        styleAttr.remove();
      }
    }
  });

  if (changed) {
    sourceFile.saveSync();
  }
}

project.getSourceFiles(['src/**/*.ts', 'src/**/*.tsx', 'app/**/*.tsx']).forEach(processSourceFile);
console.log('AST-based inline style migration complete.');
