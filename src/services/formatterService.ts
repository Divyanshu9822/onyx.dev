import * as prettier from 'prettier/standalone';
import parserHtml from 'prettier/plugins/html';
import parserCss from 'prettier/plugins/postcss';
import parserBabel from 'prettier/plugins/babel';
import pluginEstree from 'prettier/plugins/estree'; 

export const formatCode = async (
  code: string,
  type: 'html' | 'css' | 'js'
): Promise<string> => {
  if (!code || code.trim() === '') return code;

  try {
    const baseOptions = {
      printWidth: 80,
      semi: true,
      singleQuote: true,
    };

    if (type === 'html') {
      return await prettier.format(code, {
        ...baseOptions,
        parser: 'html',
        plugins: [parserHtml],
      });
    }

    if (type === 'css') {
      return await prettier.format(code, {
        ...baseOptions,
        parser: 'css',
        plugins: [parserCss],
      });
    }

    if (type === 'js') {
      return await prettier.format(code, {
        ...baseOptions,
        parser: 'babel',
        plugins: [parserBabel, pluginEstree], 
      });
    }

    return code;
  } catch (error) {
    console.error(`Error formatting ${type} code:`, error);
    return code;
  }
};
