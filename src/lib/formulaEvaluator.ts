/**
 * Safe Math Formula Evaluator - supports Excel-like functions
 * Supports: +, -, *, /, ^, %, parentheses
 * Functions: SUM, AVG, MAX, MIN, ROUND, ABS, SQRT, POW, COUNT, IF
 */

function tokenize(expr: string): string[] {
  const tokens: string[] = [];
  let i = 0;
  while (i < expr.length) {
    if (/\s/.test(expr[i])) { i++; continue; }
    if (/[0-9.]/.test(expr[i])) {
      let num = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) num += expr[i++];
      tokens.push(num);
    } else if (/[A-Za-z]/.test(expr[i])) {
      let word = '';
      while (i < expr.length && /[A-Za-z0-9]/.test(expr[i])) word += expr[i++];
      tokens.push(word.toUpperCase());
    } else if ('+-*/^%(),<>=!'.includes(expr[i])) {
      // Handle >= <= !=
      if (i + 1 < expr.length && ['>=', '<=', '!='].includes(expr[i] + expr[i + 1])) {
        tokens.push(expr[i] + expr[i + 1]);
        i += 2;
      } else {
        tokens.push(expr[i++]);
      }
    } else {
      i++;
    }
  }
  return tokens;
}

function parseArgs(tokens: string[], pos: number): { args: number[]; end: number } {
  // pos should be at '('
  const args: number[] = [];
  let depth = 0;
  let argTokens: string[] = [];
  let i = pos;
  while (i < tokens.length) {
    if (tokens[i] === '(') {
      depth++;
      if (depth > 1) argTokens.push(tokens[i]);
    } else if (tokens[i] === ')') {
      depth--;
      if (depth === 0) {
        if (argTokens.length > 0) args.push(evalTokens(argTokens));
        break;
      } else {
        argTokens.push(tokens[i]);
      }
    } else if (tokens[i] === ',' && depth === 1) {
      if (argTokens.length > 0) args.push(evalTokens(argTokens));
      argTokens = [];
    } else {
      argTokens.push(tokens[i]);
    }
    i++;
  }
  return { args, end: i };
}

function evalTokens(tokens: string[]): number {
  if (tokens.length === 0) return 0;

  // Recursive descent parser
  let pos = 0;

  function peek() { return tokens[pos]; }
  function consume() { return tokens[pos++]; }

  function parseExpr(): number { return parseComparison(); }

  function parseComparison(): number {
    let left = parseAddSub();
    while (pos < tokens.length && ['>', '<', '>=', '<=', '=', '!='].includes(peek())) {
      const op = consume();
      const right = parseAddSub();
      if (op === '>') left = left > right ? 1 : 0;
      else if (op === '<') left = left < right ? 1 : 0;
      else if (op === '>=') left = left >= right ? 1 : 0;
      else if (op === '<=') left = left <= right ? 1 : 0;
      else if (op === '=' || op === '==') left = left === right ? 1 : 0;
      else if (op === '!=') left = left !== right ? 1 : 0;
    }
    return left;
  }

  function parseAddSub(): number {
    let left = parseMulDiv();
    while (pos < tokens.length && (peek() === '+' || peek() === '-')) {
      const op = consume();
      const right = parseMulDiv();
      left = op === '+' ? left + right : left - right;
    }
    return left;
  }

  function parseMulDiv(): number {
    let left = parsePow();
    while (pos < tokens.length && (peek() === '*' || peek() === '/' || peek() === '%')) {
      const op = consume();
      const right = parsePow();
      if (op === '*') left = left * right;
      else if (op === '/') left = right !== 0 ? left / right : NaN;
      else if (op === '%') left = left % right;
    }
    return left;
  }

  function parsePow(): number {
    let base = parseUnary();
    if (pos < tokens.length && peek() === '^') {
      consume();
      const exp = parseUnary();
      base = Math.pow(base, exp);
    }
    return base;
  }

  function parseUnary(): number {
    if (pos < tokens.length && peek() === '-') {
      consume();
      return -parsePrimary();
    }
    if (pos < tokens.length && peek() === '+') {
      consume();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const tok = peek();

    // Number
    if (/^-?[0-9.]+$/.test(tok)) {
      consume();
      return parseFloat(tok);
    }

    // Function call
    if (/^[A-Z]+$/.test(tok)) {
      const funcName = consume();
      if (peek() !== '(') return NaN;
      const { args, end } = parseArgs(tokens, pos);
      pos = end + 1;

      switch (funcName) {
        case 'SUM': return args.reduce((a, b) => a + b, 0);
        case 'AVG': case 'AVERAGE': return args.length > 0 ? args.reduce((a, b) => a + b, 0) / args.length : 0;
        case 'MAX': return Math.max(...args);
        case 'MIN': return Math.min(...args);
        case 'COUNT': return args.length;
        case 'ROUND': return args.length >= 2 ? Math.round(args[0] * Math.pow(10, args[1])) / Math.pow(10, args[1]) : Math.round(args[0]);
        case 'ABS': return Math.abs(args[0] ?? 0);
        case 'SQRT': return Math.sqrt(args[0] ?? 0);
        case 'POW': return Math.pow(args[0] ?? 0, args[1] ?? 2);
        case 'CEIL': return Math.ceil(args[0] ?? 0);
        case 'FLOOR': return Math.floor(args[0] ?? 0);
        case 'LOG': return args.length >= 2 ? Math.log(args[0]) / Math.log(args[1]) : Math.log10(args[0] ?? 1);
        case 'LN': return Math.log(args[0] ?? 1);
        case 'SIN': return Math.sin((args[0] ?? 0) * Math.PI / 180);
        case 'COS': return Math.cos((args[0] ?? 0) * Math.PI / 180);
        case 'TAN': return Math.tan((args[0] ?? 0) * Math.PI / 180);
        case 'PI': return Math.PI;
        case 'IF': return args[0] !== 0 ? (args[1] ?? 0) : (args[2] ?? 0);
        case 'MOD': return args[0] % args[1];
        case 'PRODUCT': return args.reduce((a, b) => a * b, 1);
        default: return NaN;
      }
    }

    // Parentheses
    if (tok === '(') {
      consume();
      const val = parseExpr();
      if (peek() === ')') consume();
      return val;
    }

    // Constants
    if (tok === 'PI') { consume(); return Math.PI; }
    if (tok === 'E') { consume(); return Math.E; }

    consume();
    return NaN;
  }

  const result = parseExpr();
  return result;
}

export function evaluateFormula(input: string): { result: string; error: boolean } {
  try {
    const raw = input.trim().replace(/^=/, '');
    const tokens = tokenize(raw);
    const result = evalTokens(tokens);
    if (isNaN(result) || !isFinite(result)) {
      return { result: '#ERROR!', error: true };
    }
    // Format: if integer-like, show no decimals; else up to 10 decimals
    const formatted = Number.isInteger(result)
      ? result.toString()
      : parseFloat(result.toFixed(10)).toString();
    return { result: formatted, error: false };
  } catch {
    return { result: '#ERROR!', error: true };
  }
}

export function isFormula(text: string): boolean {
  return text.trim().startsWith('=');
}
