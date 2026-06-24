import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REFERENCE_PATH = path.resolve(__dirname, '../../specification/ORGF_1.0.0_reference.yaml');
const EXPECTED_VERSION = '1.0.0';

const SPEC = YAML.parse(fs.readFileSync(REFERENCE_PATH, 'utf8'));
const CANONICAL_REFERENCE = SPEC.reference;

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (isObject(value)) return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  return value;
}

function sameCanonicalReference(reference) {
  return JSON.stringify(stable(reference)) === JSON.stringify(stable(CANONICAL_REFERENCE));
}

function addIssue(issues, level, pathName, message) {
  issues.push({ level, path: pathName, message });
}

function checkString(value, max, pathName, issues) {
  if (typeof value !== 'string') {
    addIssue(issues, 'error', pathName, 'must be a string');
    return;
  }
  if (value.length > max) {
    addIssue(issues, 'remark', pathName, `exceeds max${max}; normalization policy is truncate`);
  }
}

function checkEnum(value, allowed, pathName, issues) {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    addIssue(issues, 'remark', pathName, `must be one of: ${allowed.join(', ')}; normalization policy is default`);
  }
}

function checkHexOrDefault(value, pathName, issues) {
  if (typeof value !== 'string' || !(value === 'default' || /^#[0-9A-Fa-f]{6}$/.test(value))) {
    addIssue(issues, 'remark', pathName, 'must be default or a #HEX colour; normalization policy is default');
  }
}

function checkKnownFields(object, allowed, pathName, issues) {
  for (const key of Object.keys(object)) {
    if (!allowed.includes(key)) {
      addIssue(issues, 'remark', `${pathName}.${key}`, 'unknown field; normalization policy is remark');
    }
  }
}

function validateMeta(meta, issues) {
  if (!isObject(meta)) {
    addIssue(issues, 'error', 'meta', 'required section must be a mapping');
    return;
  }
  const limits = { title: 250, author: 250, rights_holder: 250, copyright: 500, license: 120 };
  checkKnownFields(meta, ['title', 'author', 'rights_holder', 'copyright', 'license', 'created', 'updated', 'status'], 'meta', issues);
  for (const [field, limit] of Object.entries(limits)) {
    if (field in meta) checkString(meta[field], limit, `meta.${field}`, issues);
  }
  for (const field of ['created', 'updated']) {
    if (field in meta) {
      checkString(meta[field], 64, `meta.${field}`, issues);
      if (typeof meta[field] === 'string' && !/^\d{4}-\d{2}-\d{2}(?:T[^\s]+)?$/.test(meta[field])) {
        addIssue(issues, 'remark', `meta.${field}`, 'should use YYYY-MM-DD or ISO 8601');
      }
    }
  }
  if ('status' in meta) checkEnum(meta.status, ['draft', 'final', 'archived'], 'meta.status', issues);
}

function validateModel(model, issues) {
  if (!isObject(model)) {
    addIssue(issues, 'error', 'model', 'optional section must be a mapping when present');
    return;
  }
  checkKnownFields(model, ['name', 'desc', 'value_label', 'value_unit'], 'model', issues);
  const limits = { name: 250, desc: 1000, value_label: 80, value_unit: 40 };
  for (const [field, limit] of Object.entries(limits)) {
    if (field in model) checkString(model[field], limit, `model.${field}`, issues);
  }
}

function validatePic(pic, pathName, issues) {
  if (!isObject(pic)) {
    addIssue(issues, 'error', pathName, 'must be a mapping when present');
    return;
  }
  checkKnownFields(pic, ['set', 'name'], pathName, issues);
  if (!('set' in pic)) addIssue(issues, 'error', `${pathName}.set`, 'required when pic is present');
  else checkEnum(pic.set, ['emoji', 'lucide', 'feather', 'simple-icons', 'iconify'], `${pathName}.set`, issues);
  if (!('name' in pic)) addIssue(issues, 'error', `${pathName}.name`, 'required when pic is present');
  else checkString(pic.name, 250, `${pathName}.name`, issues);
}

function validateStyle(style, pathName, issues) {
  if (!isObject(style)) {
    addIssue(issues, 'error', pathName, 'must be a mapping when present');
    return;
  }
  checkKnownFields(style, ['fill', 'contour', 'contour_width'], pathName, issues);
  if ('fill' in style) checkHexOrDefault(style.fill, `${pathName}.fill`, issues);
  if ('contour' in style) checkEnum(style.contour, ['default', 'solid', 'dashed', 'dotted', 'double'], `${pathName}.contour`, issues);
  if ('contour_width' in style) checkEnum(style.contour_width, ['default', 'regular', 'bold'], `${pathName}.contour_width`, issues);
}

function validateRelation(relation, pathName, issues) {
  if (!isObject(relation)) {
    addIssue(issues, 'error', pathName, 'must be a mapping when present');
    return;
  }
  checkKnownFields(relation, ['line', 'line_width', 'color'], pathName, issues);
  if ('line' in relation) checkEnum(relation.line, ['default', 'solid', 'dashed', 'dotted'], `${pathName}.line`, issues);
  if ('line_width' in relation) checkEnum(relation.line_width, ['default', 'regular', 'bold'], `${pathName}.line_width`, issues);
  if ('color' in relation) checkHexOrDefault(relation.color, `${pathName}.color`, issues);
}

function validateBlock(block, pathName, issues, inheritedHidden = false) {
  if (!isObject(block)) {
    addIssue(issues, 'error', pathName, 'block must be a mapping');
    return;
  }
  checkKnownFields(block, ['name', 'desc', 'value', 'pic', 'tags', 'hidden', 'branch_orientation', 'style', 'relation', 'children'], pathName, issues);
  if ('name' in block) checkString(block.name, 250, `${pathName}.name`, issues);
  if ('desc' in block) checkString(block.desc, 500, `${pathName}.desc`, issues);
  if ('value' in block && (typeof block.value !== 'number' || !Number.isFinite(block.value))) {
    addIssue(issues, 'remark', `${pathName}.value`, 'must be a finite number; normalization policy is default');
  }
  if ('pic' in block) validatePic(block.pic, `${pathName}.pic`, issues);
  if ('tags' in block) {
    if (!Array.isArray(block.tags)) {
      addIssue(issues, 'error', `${pathName}.tags`, 'must be an array of strings');
    } else {
      block.tags.forEach((tag, index) => checkString(tag, 80, `${pathName}.tags[${index}]`, issues));
    }
  }
  if ('hidden' in block && typeof block.hidden !== 'boolean') {
    addIssue(issues, 'remark', `${pathName}.hidden`, 'must be boolean; normalization policy is default:false');
  }
  const ownHidden = block.hidden === true;
  if (inheritedHidden && !ownHidden) {
    addIssue(issues, 'remark', `${pathName}.hidden`, 'hidden branch inconsistency: a descendant of hidden:true must also have hidden:true');
  }
  if ('branch_orientation' in block) checkEnum(block.branch_orientation, ['auto', 'horizontal', 'vertical'], `${pathName}.branch_orientation`, issues);
  if ('style' in block) validateStyle(block.style, `${pathName}.style`, issues);
  if ('relation' in block) validateRelation(block.relation, `${pathName}.relation`, issues);
  if ('children' in block) {
    if (!Array.isArray(block.children)) {
      addIssue(issues, 'error', `${pathName}.children`, 'must be an array of blocks');
    } else {
      block.children.forEach((child, index) => validateBlock(child, `${pathName}.children[${index}]`, issues, inheritedHidden || ownHidden));
    }
  }
}

export function validateOrgfText(text) {
  const issues = [];
  if (text.charCodeAt(0) === 0xFEFF) addIssue(issues, 'error', 'file', 'UTF-8 BOM is not allowed');
  const document = YAML.parseDocument(text, { prettyErrors: false, uniqueKeys: true });
  for (const error of document.errors) addIssue(issues, 'error', 'yaml', error.message);
  if (document.errors.length > 0) return issues;
  const data = document.toJS();
  if (!isObject(data)) {
    addIssue(issues, 'error', 'file', 'top-level YAML value must be a mapping');
    return issues;
  }
  const keys = Object.keys(data);
  checkKnownFields(data, ['orgformat', 'reference', 'meta', 'model', 'root'], 'top_level', issues);
  if (!('orgformat' in data)) addIssue(issues, 'error', 'orgformat', 'required top-level field is missing');
  else if (data.orgformat !== EXPECTED_VERSION) addIssue(issues, 'error', 'orgformat', `reference validator supports only ${EXPECTED_VERSION}`);
  if (!('meta' in data)) addIssue(issues, 'error', 'meta', 'required top-level section is missing');
  else validateMeta(data.meta, issues);
  if ('model' in data) validateModel(data.model, issues);
  if (!('root' in data)) addIssue(issues, 'error', 'root', 'required top-level block is missing');
  else validateBlock(data.root, 'root', issues);
  if ('reference' in data) {
    if (!isObject(data.reference)) addIssue(issues, 'error', 'reference', 'must be a mapping when present');
    else if (!sameCanonicalReference(data.reference)) addIssue(issues, 'remark', 'reference', 'is present but is not the complete canonical ORGF 1.0.0 reference published in this repository');
  }
  const expectedOrder = ['orgformat', 'reference', 'meta', 'model', 'root'];
  const order = keys.filter((key) => expectedOrder.includes(key));
  const canonicalOrder = expectedOrder.filter((key) => key in data);
  if (JSON.stringify(order) !== JSON.stringify(canonicalOrder)) {
    addIssue(issues, 'remark', 'top_level', 'sections are not in canonical order: orgformat, reference, meta, model, root');
  }
  return issues;
}

export function validateOrgfFile(filePath) {
  return validateOrgfText(fs.readFileSync(filePath, 'utf8'));
}

function printHelp() {
  console.log('Usage: node src/validate-orgf.mjs [--json] <file.orgf>');
  console.log('Validates raw ORGF 1.0.0 source. It reports errors and remarks; it does not normalise files.');
}

function cli() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h') || args.length === 0) {
    printHelp();
    process.exit(args.length === 0 ? 1 : 0);
  }
  const jsonMode = args.includes('--json');
  const filePath = args.find((arg) => !arg.startsWith('-'));
  if (!filePath) {
    printHelp();
    process.exit(1);
  }
  const issues = validateOrgfFile(path.resolve(process.cwd(), filePath));
  const errors = issues.filter((issue) => issue.level === 'error');
  const remarks = issues.filter((issue) => issue.level === 'remark');
  if (jsonMode) {
    console.log(JSON.stringify({ file: filePath, valid: errors.length === 0, errors, remarks }, null, 2));
  } else if (issues.length === 0) {
    console.log(`OK: ${filePath} conforms to ORGF ${EXPECTED_VERSION}.`);
  } else {
    for (const issue of issues) console.log(`${issue.level.toUpperCase()} ${issue.path}: ${issue.message}`);
    console.log(`Summary: ${errors.length} error(s), ${remarks.length} remark(s).`);
  }
  process.exit(errors.length === 0 ? 0 : 2);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) cli();
