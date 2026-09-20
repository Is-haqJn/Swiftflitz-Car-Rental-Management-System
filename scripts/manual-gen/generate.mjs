import {
  Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun,
  AlignmentType, BorderStyle, WidthType, ShadingType,
  PageNumber, Header, Footer, convertInchesToTwip,
} from 'docx';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, '..', '..', 'SwiftflitzMs Manual_new.docx');

/* ─── BRAND PALETTE ─── */
const C = {
  navy:       '1B3A5C',
  blue:       '2563EB',
  lightBlue:  'DBEAFE',
  rowAlt:     'F1F5F9',
  white:      'FFFFFF',
  border:     'CBD5E1',
  divider:    'E2E8F0',
  text:       '1E293B',
  muted:      '64748B',
  green:      '16A34A',
  lightGreen: 'DCFCE7',
  amber:      'B45309',
  amberBg:    'FEF3C7',
};
const FONT = 'Calibri';
const inch = convertInchesToTwip;

/* ─── BORDER HELPERS ─── */
const borders = (color = C.border, size = 4) => ({
  top:    { style: BorderStyle.SINGLE, size, color },
  bottom: { style: BorderStyle.SINGLE, size, color },
  left:   { style: BorderStyle.SINGLE, size, color },
  right:  { style: BorderStyle.SINGLE, size, color },
});
const noBorders = () => ({
  top:    { style: BorderStyle.NIL, size: 0, color: 'auto' },
  bottom: { style: BorderStyle.NIL, size: 0, color: 'auto' },
  left:   { style: BorderStyle.NIL, size: 0, color: 'auto' },
  right:  { style: BorderStyle.NIL, size: 0, color: 'auto' },
});

/* ════════════════════════════════════════════════
   SHARED HELPERS
   ════════════════════════════════════════════════ */

const pb = () => new Paragraph({ children: [], pageBreakBefore: true });
const spacer = (n = 120) => new Paragraph({ children: [], spacing: { before: n, after: 0 } });

/* Part heading — full-width navy bar */
function partHeading(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, font: FONT, bold: true, color: C.white, size: 52 })],
        spacing: { before: 120, after: 120 },
      })],
      shading: { type: ShadingType.CLEAR, fill: C.navy, color: 'auto' },
      borders: noBorders(),
      margins: { top: 100, bottom: 100, left: inch(0.25), right: inch(0.25) },
    })] })],
  });
}

/* Section heading (1.x / 2.x) — left-accent bar */
function h2(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text, font: FONT, bold: true, color: C.navy, size: 30 })],
        spacing: { before: 80, after: 80 },
      })],
      shading: { type: ShadingType.CLEAR, fill: C.rowAlt, color: 'auto' },
      borders: {
        top:    { style: BorderStyle.NIL,   size: 0,  color: 'auto' },
        bottom: { style: BorderStyle.NIL,   size: 0,  color: 'auto' },
        right:  { style: BorderStyle.NIL,   size: 0,  color: 'auto' },
        left:   { style: BorderStyle.THICK, size: 20, color: C.blue },
      },
      margins: { top: 80, bottom: 80, left: inch(0.18), right: inch(0.18) },
    })] })],
    margins: { top: 160, bottom: 80 },
  });
}

const h3 = (text) => new Paragraph({
  children: [new TextRun({ text, font: FONT, bold: true, color: C.blue, size: 24 })],
  spacing: { before: 200, after: 80 },
});

const h4 = (text) => new Paragraph({
  children: [new TextRun({ text, font: FONT, bold: true, italics: true, color: C.navy, size: 22 })],
  spacing: { before: 160, after: 60 },
});

/* Body — accepts plain string or [{text, bold?, italic?}] */
function body(content, align = AlignmentType.JUSTIFIED) {
  const runs = typeof content === 'string'
    ? [new TextRun({ text: content, font: FONT, size: 22, color: C.text })]
    : content.map(s => new TextRun({ text: s.text, font: FONT, size: 22, color: C.text, bold: s.bold || false, italics: s.italic || false }));
  return new Paragraph({ children: runs, spacing: { before: 80, after: 100 }, alignment: align });
}

const bullet = (text, level = 0) => new Paragraph({
  children: [
    new TextRun({ text: level === 0 ? '•  ' : '◦  ', font: FONT, size: 22, color: C.blue, bold: true }),
    new TextRun({ text, font: FONT, size: 22, color: C.text }),
  ],
  indent: { left: inch(0.3 + level * 0.25) },
  spacing: { before: 40, after: 40 },
});

/* Note callout */
function note(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      children: [new Paragraph({
        children: [
          new TextRun({ text: 'Note:  ', font: FONT, bold: true, size: 20, color: C.navy }),
          new TextRun({ text, font: FONT, size: 20, color: C.text }),
        ],
        spacing: { before: 60, after: 60 },
      })],
      shading: { type: ShadingType.CLEAR, fill: C.lightBlue, color: 'auto' },
      borders: {
        top:    { style: BorderStyle.NIL,   size: 0,  color: 'auto' },
        bottom: { style: BorderStyle.NIL,   size: 0,  color: 'auto' },
        right:  { style: BorderStyle.NIL,   size: 0,  color: 'auto' },
        left:   { style: BorderStyle.THICK, size: 16, color: C.blue },
      },
      margins: { top: 80, bottom: 80, left: inch(0.2), right: inch(0.2) },
    })] })],
    margins: { top: 80, bottom: 80 },
  });
}

/* Navigation path */
function navPath(text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({ children: [new TableCell({
      children: [new Paragraph({
        children: [
          new TextRun({ text: 'Navigate to:  ', font: FONT, size: 19, color: C.muted }),
          new TextRun({ text, font: FONT, size: 19, color: C.navy, bold: true }),
        ],
        spacing: { before: 60, after: 60 },
      })],
      shading: { type: ShadingType.CLEAR, fill: C.rowAlt, color: 'auto' },
      borders: {
        top:    { style: BorderStyle.NIL,   size: 0,  color: 'auto' },
        bottom: { style: BorderStyle.NIL,   size: 0,  color: 'auto' },
        right:  { style: BorderStyle.NIL,   size: 0,  color: 'auto' },
        left:   { style: BorderStyle.THICK, size: 12, color: C.navy },
      },
      margins: { top: 60, bottom: 60, left: inch(0.18), right: inch(0.18) },
    })] })],
    margins: { top: 60, bottom: 80 },
  });
}

/* Numbered step */
const step = (num, text) => new Paragraph({
  children: [
    new TextRun({ text: `${num}.`, font: FONT, bold: true, size: 22, color: C.blue }),
    new TextRun({ text: `  ${text}`, font: FONT, size: 22, color: C.text }),
  ],
  spacing: { before: 60, after: 60 },
  indent: { left: inch(0.05) },
});

/* Field reference table — [label, required (bool), typeAndDescription] */
function fieldTable(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        tableHeader: true,
        children: [
          mkHdrCell('Field', 30),
          mkHdrCell('Req.', 8),
          mkHdrCell('Type  &  Description', 62),
        ],
      }),
      ...rows.map(([label, req, desc], i) => new TableRow({
        children: [
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: label, font: FONT, size: 20, color: C.text, bold: req })],
              spacing: { before: 60, after: 60 },
            })],
            shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? C.white : C.rowAlt, color: 'auto' },
            borders: borders(C.border, 2),
            margins: { top: 60, bottom: 60, left: inch(0.12), right: inch(0.08) },
            width: { size: 30, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: req ? '✱' : '—', font: FONT, size: 18, color: req ? C.blue : C.muted, bold: req })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 60 },
            })],
            shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? C.white : C.rowAlt, color: 'auto' },
            borders: borders(C.border, 2),
            margins: { top: 60, bottom: 60, left: 0, right: 0 },
            width: { size: 8, type: WidthType.PERCENTAGE },
          }),
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: desc, font: FONT, size: 20, color: C.text })],
              spacing: { before: 60, after: 60 },
            })],
            shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? C.white : C.rowAlt, color: 'auto' },
            borders: borders(C.border, 2),
            margins: { top: 60, bottom: 60, left: inch(0.12), right: inch(0.12) },
            width: { size: 62, type: WidthType.PERCENTAGE },
          }),
        ],
      })),
    ],
  });
}

/* ─── GENERIC TABLE HELPERS ─── */
function mkHdrCell(text, width) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, font: FONT, bold: true, color: C.white, size: 20 })],
      spacing: { before: 80, after: 80 },
    })],
    shading: { type: ShadingType.CLEAR, fill: C.navy, color: 'auto' },
    borders: borders(C.navy, 4),
    margins: { top: 60, bottom: 60, left: inch(0.12), right: inch(0.12) },
    width: { size: width, type: WidthType.PERCENTAGE },
  });
}
function mkDataCell(text, width, rowIdx, bold = false) {
  return new TableCell({
    children: [new Paragraph({
      children: [new TextRun({ text, font: FONT, size: 20, color: C.text, bold })],
      spacing: { before: 60, after: 60 },
    })],
    shading: { type: ShadingType.CLEAR, fill: rowIdx % 2 === 0 ? C.white : C.rowAlt, color: 'auto' },
    borders: borders(C.border, 2),
    margins: { top: 60, bottom: 60, left: inch(0.12), right: inch(0.12) },
    width: { size: width, type: WidthType.PERCENTAGE },
  });
}
function table2(rows, w1 = 32, w2 = 68) {
  const [hdr, ...data] = rows;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: [mkHdrCell(hdr[0], w1), mkHdrCell(hdr[1], w2)] }),
      ...data.map((r, i) => new TableRow({ children: [mkDataCell(r[0], w1, i), mkDataCell(r[1], w2, i)] })),
    ],
  });
}
function table3(rows, w1 = 28, w2 = 36, w3 = 36) {
  const [hdr, ...data] = rows;
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: [mkHdrCell(hdr[0], w1), mkHdrCell(hdr[1], w2), mkHdrCell(hdr[2], w3)] }),
      ...data.map((r, i) => new TableRow({ children: [mkDataCell(r[0], w1, i), mkDataCell(r[1], w2, i), mkDataCell(r[2], w3, i)] })),
    ],
  });
}

/* Role capability block */
function roleBlock(name, color, canList, cannotList) {
  const maxLen = Math.max(canList.length, cannotList.length);
  const rows = [
    new TableRow({ children: [new TableCell({
      children: [new Paragraph({
        children: [new TextRun({ text: name, font: FONT, bold: true, color: C.white, size: 24 })],
        spacing: { before: 80, after: 80 },
      })],
      shading: { type: ShadingType.CLEAR, fill: color, color: 'auto' },
      borders: noBorders(),
      margins: { top: 60, bottom: 60, left: inch(0.2), right: inch(0.2) },
      columnSpan: 2,
    })] }),
  ];
  for (let i = 0; i < maxLen; i++) {
    rows.push(new TableRow({ children: [
      new TableCell({
        children: [new Paragraph({
          children: [
            i === 0 ? new TextRun({ text: '✔  ', font: FONT, bold: true, size: 20, color: C.green }) : new TextRun({ text: '      ', font: FONT, size: 20 }),
            new TextRun({ text: canList[i] || '', font: FONT, size: 20, color: C.text }),
          ],
          spacing: { before: 40, after: 40 },
        })],
        shading: { type: ShadingType.CLEAR, fill: C.lightGreen, color: 'auto' },
        borders: borders(C.border, 2),
        margins: { top: 40, bottom: 40, left: inch(0.15), right: inch(0.15) },
        width: { size: 50, type: WidthType.PERCENTAGE },
      }),
      new TableCell({
        children: [new Paragraph({
          children: [
            i === 0 ? new TextRun({ text: '✖  ', font: FONT, bold: true, size: 20, color: C.amber }) : new TextRun({ text: '      ', font: FONT, size: 20 }),
            new TextRun({ text: cannotList[i] || '', font: FONT, size: 20, color: C.text }),
          ],
          spacing: { before: 40, after: 40 },
        })],
        shading: { type: ShadingType.CLEAR, fill: C.amberBg, color: 'auto' },
        borders: borders(C.border, 2),
        margins: { top: 40, bottom: 40, left: inch(0.15), right: inch(0.15) },
        width: { size: 50, type: WidthType.PERCENTAGE },
      }),
    ]}));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows });
}

/* Section end marker */
const endMarker = (part) => new Paragraph({
  children: [new TextRun({ text: `— End of Part ${part} —`, font: FONT, italics: true, color: C.muted, size: 20 })],
  alignment: AlignmentType.CENTER,
  spacing: { before: 200, after: 0 },
});

/* ════════════════════════════════════════════════
   TITLE PAGE
   ════════════════════════════════════════════════ */
const titlePageChildren = [
  spacer(2800),
  new Paragraph({ children: [new TextRun({ text: 'SWIFTFLITZ', font: FONT, bold: true, color: C.navy, size: 80 })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 0 } }),
  new Paragraph({ children: [new TextRun({ text: 'Car Rental Management System', font: FONT, color: C.blue, size: 36 })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 320 } }),
  spacer(200),
  new Paragraph({ children: [new TextRun({ text: 'User Manual', font: FONT, bold: true, color: C.navy, size: 56 })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 } }),
  new Paragraph({ children: [new TextRun({ text: 'For Administrators & Managers', font: FONT, color: C.muted, size: 26 })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 800 } }),
  spacer(1000),
  new Paragraph({ children: [new TextRun({ text: 'Version 1.0  ·  May 2026', font: FONT, color: C.muted, size: 20 })], alignment: AlignmentType.CENTER }),
  new Paragraph({ children: [new TextRun({ text: 'Confidential – Internal Use Only', font: FONT, color: C.muted, size: 18, italics: true })], alignment: AlignmentType.CENTER, spacing: { before: 40 } }),
];

/* ════════════════════════════════════════════════
   PART 1  —  ORIENTATION
   ════════════════════════════════════════════════ */
const part1 = [
  pb(),
  partHeading('PART 1  —  ORIENTATION'),
  spacer(200),

  /* 1.1 */
  h2('1.1   Logging In'),
  spacer(80),
  body('Navigate to your administration URL (e.g. https://app.swiftflitz.com/management). You will be presented with the login screen.'),
  body([{ text: 'Enter your ' }, { text: 'Email Address', bold: true }, { text: ' and ' }, { text: 'Password', bold: true }, { text: ', then click ' }, { text: 'Sign In', bold: true }, { text: '. You will be redirected to the main Dashboard on success.' }]),
  note('If you forget your password, click Forgot Password? on the login screen. A reset link will be sent to your registered email address.'),
  spacer(80),

  /* 1.2 */
  h2('1.2   The Dashboard'),
  spacer(80),
  body('The Dashboard is the first screen you see after logging in. It gives you a real-time snapshot of the business. What you see depends on your role — items you do not have permission for are hidden automatically.'),
  h3('KPI Stat Cards'),
  body('The top section displays key performance indicator cards. Each shows a primary metric, a subtitle, and links to the relevant section. Click any card to navigate directly.'),
  spacer(60),
  table3([
    ['Card', 'Primary Metric', 'Subtitle'],
    ['Revenue This Month',            'Total payments collected in the current calendar month',  'Outstanding pending payments amount'],
    ['Total Customers',               'Total registered customer count',                          'New customers added this month'],
    ['Active Rentals',                'Rentals currently in progress',                            'Number of those that are overdue'],
    ['Pending Rentals',               'Rentals awaiting confirmation or pickup',                  'Number of pending quote requests'],
    ['Confirmed Rentals',             'Confirmed rentals not yet picked up',                      '"Awaiting pickup"'],
    ['Overdue Rentals',               'Rentals past their scheduled return date',                 '"Past return date"'],
    ['Airport Bookings This Month',   'Airport transfer bookings for the current month',          'Number of pending airport bookings'],
    ['Chauffeur Bookings This Month', 'Chauffeur bookings for the current month',                 'Number of pending chauffeur bookings'],
  ], 24, 42, 34),
  spacer(120),

  h3('Quick Stats Panel'),
  body('A 2 × 2 panel with four live counters — each has a View link to navigate to the relevant list.'),
  spacer(60),
  table2([
    ['Stat', 'Where "View" Takes You'],
    ['Overdue Rentals',    'Overdue Rentals list'],
    ['Vehicles In Use',    'Rented Vehicles list'],
    ['Available Vehicles', 'Available Vehicles list'],
    ['Pending Quotes',     'Quote Requests list'],
  ]),
  spacer(120),

  h3('Charts'),
  spacer(60),
  table2([
    ['Chart', 'Description'],
    ['Revenue Trend',       'Area chart of collected revenue over time. Toggle Daily / Weekly / Monthly. Hover any point for the exact figure and rental count.'],
    ['Fleet Status',        'Donut chart: Available (green), In Use (blue), Other (grey). Total vehicle count shown as subtitle.'],
    ['Fleet Utilization',   'Radial gauge showing what percentage of the fleet is currently rented. Higher = more efficient use.'],
    ['Rental Distribution', 'Donut chart: Active (green), Pending (amber), Overdue (red). Centre shows combined total.'],
  ]),
  spacer(120),

  h3('Data Tables'),
  body([{ text: 'Recent Rentals', bold: true }, { text: ' — 5 most recent rentals. Columns: Reference, Customer, Vehicle, Status, Date. Click any row to open the rental.' }]),
  body([{ text: 'Upcoming Returns', bold: true }, { text: ' — Active rentals due back soon or already overdue. Overdue entries show in red with days count. Click any row to open the rental.' }]),
  spacer(80),
  h3('Branch Selector'),
  body([{ text: 'Visible when your account covers more than one branch. Use the top-left dropdown to filter Dashboard data to a specific branch, or select ' }, { text: 'All Branches', bold: true }, { text: ' for a combined view.' }]),
  spacer(80),

  /* 1.3 */
  h2('1.3   Roles & What Each Can Do'),
  spacer(80),
  body('Five built-in roles control what each user can see and do. A user holds exactly one role. Items and buttons outside your role\'s permissions are hidden automatically.'),
  spacer(120),

  roleBlock('Admin', C.navy,
    ['Full rental lifecycle (create, confirm, pickup, return, complete)', 'All vehicle management (add, edit, pricing, availability, maintenance)', 'All customer management (add, edit, verify, blacklist)', 'Manage users, roles, and access permissions', 'Manage branches and assign branch members', 'All reports (revenue, utilisation, performance, expenses)', 'Discounts, coupons, and full transaction ledger', 'Airport transfer and chauffeur rental operations', 'System settings and notification configuration', 'Website content management', 'Drivers and fleet vehicles', 'Data exports (rentals, vehicles, customers, reports)'],
    ['Impersonate other users (Super Admin only)', 'Manage system backups or view system logs', 'Clear the system cache', 'Modify core payment gateway credentials']
  ), spacer(160),

  roleBlock('Manager', '2563EB',
    ['Full rental lifecycle within their assigned branch', 'Vehicle management: add, edit, pricing, availability, maintenance, categories, features', 'Customer management: add, edit, verify, track licence expiry', 'Most reports: revenue, utilisation, outstanding payments, maintenance, customer analytics', 'Discount and coupon creation and editing', 'Fleet vehicles and drivers management', 'Airport transfer operations (bookings, packages, locations)', 'Chauffeur rental operations (bookings, customers, locations)', 'Website content editing'],
    ['Manage users, roles, or activity logs', 'View or modify system settings', 'Configure email, WhatsApp, or SMS integrations', 'Delete rentals, vehicles, or customers', 'Blacklist customers', 'View the Manager Performance report', 'Delete discounts or coupons']
  ), spacer(160),

  roleBlock('Staff', '0F766E',
    ['Create rentals and new bookings', 'Process vehicle pickup and return', 'Update rental status', 'Add and edit customer records', 'Track customer licence expiry', 'Manage vehicle availability and maintenance status', 'View quotes and pickup / return documents', 'Manage active, pending, and overdue rentals'],
    ['View all rentals (restricted to assigned rentals only)', 'Approve return inspections', 'Add or manage additional charges', 'Access any reports', 'Access system settings', 'Manage discounts or coupons', 'Any user or role management']
  ), spacer(160),

  roleBlock('Accountant', '7C3AED',
    ['View all rentals, vehicles, and customers (read-only)', 'All reports: revenue, utilisation, outstanding payments, maintenance, customer analytics', 'Export reports to PDF and Excel', 'Download data exports (rentals, vehicles, customers)', 'View full transaction ledger'],
    ['Create or edit any records', 'Manage active operations', 'Access system settings', 'Manage discounts or coupons', 'Any user or role management']
  ), spacer(160),

  roleBlock('Viewer', C.muted,
    ['View all rentals, quotes, and pickup / return documents (read-only)', 'View all vehicles and customers', 'View most reports (revenue, utilisation, outstanding payments, maintenance, customer analytics)', 'View discounts and coupons'],
    ['Create, edit, or delete anything', 'Export or download any data', 'Access system settings', 'Manage active rental operations', 'Any user or role management', 'Manager Performance report (not accessible)']
  ), spacer(120),

  /* 1.4 */
  h2('1.4   The Navigation Sidebar'),
  spacer(80),
  body('The left-hand sidebar is your primary navigation. Click any group header to expand or collapse it. Only items your role allows are shown.'),
  spacer(120),

  h3('Operations'),
  spacer(60),
  h4('Regular Rentals'),
  table2([
    ['Menu Item', 'What It Is'],
    ['All Rentals',         'Complete list of every rental with full filter and search'],
    ['Create Rental',       'Create a new in-store rental and collect payment immediately'],
    ['New Booking',         'Create a booking for a customer who will pay online later'],
    ['Quote Requests',      'Customer quote requests from the website — respond or convert to a booking'],
    ['Pending Bookings',    'Bookings awaiting staff confirmation'],
    ['Pending Approvals',   'Bookings requiring explicit management approval'],
    ['Active Rentals',      'Rentals in progress — vehicle picked up'],
    ['Overdue Rentals',     'Rentals past their return date'],
    ['Returned Rentals',    'Vehicles returned but return not yet approved'],
    ['Completed Rentals',   'Fully closed rentals'],
    ['Cancelled Rentals',   'Cancelled bookings and rentals'],
    ['Inspection Log',      'Vehicle pickup and return inspection reports with photos and notes'],
    ['Additional Charges',  'Catalogue of extra charge types (fuel, cleaning, damage fee, etc.)'],
    ['Security Deposits',   'All security deposit transactions — collected, held, and released'],
    ['Rental Locations',    'Pickup and dropoff location points used when creating rentals'],
  ]), spacer(120),

  h4('Airport Transfer'),
  table2([
    ['Menu Item', 'What It Is'],
    ['Bookings',              'All airport transfer bookings — view, manage status, assign drivers'],
    ['Customers',             'Customers who have made airport transfer bookings'],
    ['Airports',              'Airport records: name, code, location, VAT rate'],
    ['Locations',             'Pickup and dropoff points for airport transfers'],
    ['Packages',              'Transfer service packages (Economy, Executive, Group, etc.)'],
    ['Package Pricing',       'Pricing per package and destination pair'],
    ['Cancellation Settings', 'Rules and fees for booking cancellations'],
  ]), spacer(120),

  h4('Chauffeur Rental'),
  table2([
    ['Menu Item',    'What It Is'],
    ['Bookings',     'All chauffeur rental bookings — view, update status, manage assignments'],
    ['Create Booking','Create a new chauffeur booking for a customer'],
    ['Customers',    'Customer records specific to chauffeur rental'],
    ['Locations',    'Pickup and dropoff points for chauffeur bookings'],
    ['Settings',     'Chauffeur-specific configuration including pricing model'],
  ]), spacer(120),

  h4('Vehicles'),
  table2([
    ['Menu Item', 'What It Is'],
    ['All Vehicles',      'Complete rental vehicle inventory with details, pricing, and status'],
    ['Available Vehicles','Vehicles ready to rent'],
    ['Rented Vehicles',   'Vehicles currently with customers'],
    ['Under Maintenance', 'Vehicles taken off the fleet for servicing'],
    ['Add New Vehicle',   'Register a new vehicle to the rental fleet'],
    ['Vehicle Categories','Manage categories (Economy, SUV, Luxury, etc.)'],
    ['Vehicle Features',  'Manage feature tags (GPS, Air Conditioning, Baby Seat, etc.)'],
  ]), spacer(120),

  h4('Fleet Vehicles & Drivers'),
  table2([
    ['Menu Item', 'What It Is'],
    ['All Fleet Vehicles', 'Vehicles used for airport transfer and chauffeur services'],
    ['Add Fleet Vehicle',  'Register a new fleet vehicle'],
    ['All Drivers',        'Driver registry with licence details and document expiry'],
    ['Add New Driver',     'Register a new driver and upload their documents'],
  ]), spacer(120),

  h4('Customers'),
  table2([
    ['Menu Item', 'What It Is'],
    ['All Customers',          'Complete customer database'],
    ['Add New Customer',       'Register a customer manually (walk-in or phone booking)'],
    ['Customer History',       'Full rental history across all customers'],
    ['License Expiring Soon',  'Customers within 30 days of licence expiry'],
    ['License Expired',        'Customers with expired licences — cannot rent until renewed'],
    ['Blacklisted',            'Customers blocked from making bookings'],
  ]), spacer(120),

  h3('Finance'),
  spacer(60),
  table2([
    ['Menu Item', 'What It Is'],
    ['Transactions',   'Full payment transaction ledger — every payment, refund, and charge'],
    ['Discount Rules', 'Automatic discounts applied when rental criteria are met'],
    ['Discount Usages','History of applied automatic discounts'],
    ['Rental Coupons', 'Coupon codes for customer checkout — create, track, expire'],
  ]), spacer(120),

  h3('Analytics — Reports'),
  spacer(60),
  table2([
    ['Report', 'What It Shows'],
    ['Revenue Reports',       'Collected revenue, outstanding payments, and revenue trend charts'],
    ['Outstanding Payments',  'Rentals with unpaid balances — who owes how much'],
    ['Customer Analysis',     'Customer behaviour: frequency, total spend, value segments'],
    ['Vehicle Reports',       'Fleet utilisation per vehicle and category'],
    ['Manager Performance',   'Rentals handled and revenue generated per manager'],
    ['Vehicle Expenses',      'All costs recorded against each vehicle'],
    ['Maintenance & Repairs', 'Maintenance history: dates, descriptions, costs'],
  ]), spacer(120),

  h3('Communications — Notifications'),
  spacer(60),
  table2([
    ['Menu Item', 'What It Is'],
    ['All Notifications', 'Complete notification inbox'],
    ['Overdue Alerts',    'Notifications when a rental passes its return date unreturned'],
    ['New Bookings',      'Notifications for new rental, airport, or chauffeur bookings'],
    ['Return Reminders',  'Upcoming return date reminders'],
    ['Quote Requests',    'Notifications when a customer submits a quote from the website'],
  ]), spacer(120),

  h3('Administration'),
  spacer(60),
  h4('Users & Access'),
  table2([
    ['Menu Item', 'What It Is'],
    ['All Users',           'All system users with roles and branch assignments'],
    ['Add New User',        'Create a new user account and assign a role'],
    ['Roles & Permissions', 'View and manage roles and their permission sets'],
    ['Activity Logs',       'Audit trail of all user actions — who did what and when'],
  ]), spacer(80),
  h4('Branches'),
  table2([
    ['Menu Item', 'What It Is'],
    ['All Branches',   'All business branches with currency and location details'],
    ['Add New Branch', 'Create a new branch and configure its currency'],
    ['Branch Members', 'View and manage user assignments per branch'],
  ]), spacer(120),

  h3('Settings & Configuration  (Admin only)'),
  spacer(60),
  table2([
    ['Setting', 'What It Controls'],
    ['General Settings',      'Company name, logo, timezone, default currency'],
    ['Rental Settings',       'VAT rate, grace period, late return rules, security deposit policy'],
    ['Pricing Settings',      'Default rate calculation configuration'],
    ['Payment Settings',      'Payment gateway credentials (Hubtel, Paystack)'],
    ['Notification Settings', 'Which events send notifications and on which channels'],
    ['Email Configuration',   'SMTP server settings and sender details'],
    ['Email Templates',       'Customise outgoing email content'],
    ['WhatsApp Settings',     'Meta Cloud API credentials'],
    ['WhatsApp Templates',    'Approved WhatsApp message templates'],
    ['SMS Settings',          'Provider selection and credentials (Hubtel, Arkessel, Nalo)'],
    ['SMS Templates',         'Customise outgoing SMS content'],
    ['SEO Settings',          'Page titles and meta descriptions for the public website'],
    ['Backup & Maintenance',  'Database backup schedule and file management'],
  ]), spacer(120),

  h3('Website Content  (Admin only)'),
  spacer(60),
  table2([
    ['Menu Item', 'What It Controls'],
    ['Header',              'Top navigation, logo, and header call-to-action buttons'],
    ['Homepage Management', 'Hero section, feature highlights, and homepage content'],
    ['About Us Page',       'Company story, team members, and values'],
    ['Services Page',       'Services listing content'],
    ['Contact Us Page',     'Contact details and enquiry form settings'],
    ['FAQs Page',           'FAQ entries — add, edit, reorder, delete'],
    ['Terms & Conditions',  'Legal terms content'],
    ['Privacy Policy',      'Privacy policy content'],
    ['Footer',              'Footer navigation links, social media, and copyright'],
  ]), spacer(80),

  /* 1.5 */
  h2('1.5   The Header Bar'),
  spacer(80),
  body('The header bar runs across the top of every page and provides quick access to global tools.'),
  spacer(60),
  table2([
    ['Element', 'What It Does'],
    ['Branch Selector',        'Filters page data to a specific branch. Visible when your account covers multiple branches.'],
    ['Home icon',              'Opens the public-facing website in a new tab.'],
    ['Theme toggle',           'Switches between light and dark mode. Preference is saved in the browser.'],
    ['Notification bell',      'Shows your 5 most recent notifications. Unread are bold. Click any to mark read and navigate. Red badge shows unread count (99+ when over 99). Click See all notifications for the full inbox.'],
    ['Profile avatar',         'Opens the profile dropdown. Access your profile, notification preferences, or log out (confirmation prompt appears).'],
    ['Stop Impersonation',     'Admin only — visible when viewing the system as another user. Click the yellow lock icon to exit. Confirmation prompt appears.'],
  ]), spacer(80),

  /* 1.6 */
  h2('1.6   Your Profile & Notification Preferences'),
  spacer(80),
  body([{ text: 'Click your avatar (top-right) and select ' }, { text: 'Profile', bold: true }, { text: ' to edit your account details, or ' }, { text: 'Settings', bold: true }, { text: ' to manage notification preferences.' }]),
  spacer(60),
  h3('Profile Page Fields'),
  fieldTable([
    ['First Name',       true,  'Text — your given name as displayed throughout the system'],
    ['Last Name',        true,  'Text — your family name'],
    ['Email Address',    true,  'Email — used for login and notifications; must be unique'],
    ['Phone Number',     false, 'Text — optional contact number on your account'],
    ['Profile Photo',    false, 'File upload — replaces the default initials avatar. Formats: JPG, PNG. Recommended: square crop.'],
    ['Current Password', false, 'Password — required only when changing your password'],
    ['New Password',     false, 'Password — min 8 characters with letters and numbers'],
    ['Confirm Password', false, 'Password — must match New Password exactly'],
  ]),
  spacer(80),
  h3('Notification Preferences'),
  body([{ text: 'From ' }, { text: 'Settings', bold: true }, { text: ' in the profile dropdown, toggle individual notification types on or off for each channel (in-app and email). Changes take effect immediately.' }]),
  note('Password changes take effect on your next login if you are currently logged in on another device.'),
  spacer(200),
  endMarker(1),
];

/* ════════════════════════════════════════════════
   PART 2  —  INITIAL SETUP
   ════════════════════════════════════════════════ */
const part2 = [
  pb(),
  partHeading('PART 2  —  INITIAL SETUP'),
  spacer(200),
  body('This part walks through the recommended setup sequence for a fresh deployment. Complete the steps in the order shown — some sections depend on data created in earlier steps. Each section can also be revisited later to add or edit records.'),
  spacer(80),
  note('Managers can perform all steps in this section within their assigned branch. Certain fields (such as currency and exchange rate) require Admin access.'),
  spacer(120),

  /* ── 2.1 Create a Branch ── */
  h2('2.1   Create a Branch'),
  spacer(80),
  body('Branches represent your physical locations or business units. Each branch can have its own currency, pricing, and staff. If you operate from a single location with no multi-currency needs, a default branch is created automatically — you can edit it rather than creating a new one.'),
  spacer(60),
  navPath('Administration  >  Branches  >  Add New Branch'),
  spacer(60),

  step(1, 'Go to Administration > Branches > Add New Branch.'),
  step(2, 'Fill in the Branch Name. All other fields are optional but recommended.'),
  step(3, 'Enter a short Branch Code (e.g. "ACC" for Accra) — used in references and reports.'),
  step(4, 'Add the Address, Phone, and Email. These may appear on customer-facing documents.'),
  step(5, 'If this branch uses a different currency from your global default, enable the Currency section and fill in Currency Code, Symbol, and Exchange Rate.'),
  step(6, 'If this branch handles airport transfers, enable Has Airport Service and select the linked airport from the dropdown. (You must create the airport first — see section 2.3.)'),
  step(7, 'Leave Active toggled On, then click Save Branch.'),
  spacer(80),

  fieldTable([
    ['Branch Name',           true,  'Text — unique name for this branch (e.g. "Accra Head Office"). Max 255 characters.'],
    ['Branch Code',           false, 'Text — short unique identifier (e.g. "ACC"). Max 50 characters.'],
    ['Address',               false, 'Text — physical street address. Max 500 characters.'],
    ['Phone',                 false, 'Text — contact phone number displayed on customer documents. Max 30 characters.'],
    ['Email',                 false, 'Email — contact email displayed on customer documents. Max 255 characters.'],
    ['Description',           false, 'Text — internal notes about this branch.'],
    ['Active',                false, 'Toggle — set to On to make this branch operational. Default: On.'],
    ['Currency Code',         false, 'Select — ISO 4217 currency code for this branch. Options: GHS, USD, EUR, GBP, NGN, ZAR, KES, ZMW, XOF, XAF, RWF, UGX, TZS. Leave blank to use the global default.'],
    ['Currency Symbol',       false, 'Text — display symbol for the currency (e.g. ₦, $, €, ₵). Max 5 characters.'],
    ['Exchange Rate',         false, 'Number — rate to convert this branch\'s currency to the global base currency (e.g. 0.085 for NGN → GHS). Required if Currency Code and Symbol are set. Must be greater than 0.'],
    ['Show Converted Price',  false, 'Toggle — when On, vehicle listings show prices in both the branch currency and the global currency.'],
    ['Has Airport Service',   false, 'Toggle — enable if this branch operates airport transfer services.'],
    ['Linked Airport',        false, 'Select — the airport this branch serves. Required when Has Airport Service is On. The airport must already exist (see section 2.3).'],
  ]),
  spacer(80),
  note('The exchange rate is used to convert branch-currency amounts into the global reporting currency for dashboards, reports, and cross-branch comparisons. GHS branches should leave currency fields blank or set exchange rate to 1.'),
  spacer(120),

  /* ── 2.2 Set up Rental Locations ── */
  h2('2.2   Set Up Rental Locations'),
  spacer(80),
  body('Rental locations are the pickup and dropoff points available when creating a rental. Create at least one location per branch before creating your first rental. A location can serve as pickup only, dropoff only, or both.'),
  spacer(60),
  navPath('Operations  >  Regular Rentals  >  Rental Locations  >  Add Location'),
  spacer(60),

  step(1, 'Go to Operations > Regular Rentals > Rental Locations, then click Add Location.'),
  step(2, 'Select the Branch this location belongs to.'),
  step(3, 'Enter a descriptive Location Name (e.g. "Accra Airport — Arrivals Hall").'),
  step(4, 'Enter the Pickup Charge and Dropoff Charge if there is a fee for using this location. Set to 0 for free.'),
  step(5, 'Toggle Is Pickup and/or Is Dropoff to control whether this location appears in the pickup list, dropoff list, or both when creating a rental.'),
  step(6, 'Toggle Is Default if this should be pre-selected when creating a rental for this branch.'),
  step(7, 'Leave Active toggled On and click Save.'),
  spacer(80),

  fieldTable([
    ['Branch',          true,  'Select — the branch this location belongs to.'],
    ['Location Name',   true,  'Text — descriptive name shown to staff when creating a rental. Max 255 characters.'],
    ['Pickup Charge',   false, 'Number — fee charged when a customer picks up from this location. Enter 0 for free. Min: 0.'],
    ['Dropoff Charge',  false, 'Number — fee charged when a customer drops off at this location. Enter 0 for free. Min: 0.'],
    ['Is Pickup',       false, 'Toggle — when On, this location appears in the pickup location list. Default: Off.'],
    ['Is Dropoff',      false, 'Toggle — when On, this location appears in the dropoff location list. Default: Off.'],
    ['Is Chauffeur',    false, 'Toggle — when On, this location is also available for chauffeur rental bookings.'],
    ['Default Location',false, 'Toggle — when On, this location is pre-selected for this branch when creating a rental. Only one location per branch should be set as default.'],
    ['Active',          false, 'Toggle — set to On to make this location selectable. Default: On.'],
  ]),
  spacer(120),

  /* ── 2.3 Create Airports ── */
  h2('2.3   Create Airports'),
  spacer(80),
  body('Airports are required before you can create airport transfer locations, packages, or bookings, and before linking a branch to airport services. Skip this section if you do not offer airport transfer services.'),
  spacer(60),
  navPath('Operations  >  Airport Transfer  >  Airports  >  Add Airport'),
  spacer(60),

  step(1, 'Go to Operations > Airport Transfer > Airports and click Add Airport.'),
  step(2, 'Enter the Airport Name, City, and Country.'),
  step(3, 'If your country applies VAT on airport transfers, enter the VAT Rate percentage (e.g. 15 for 15%).'),
  step(4, 'Optionally link one or more branches to this airport using the Linked Branches field.'),
  step(5, 'Leave Active toggled On and click Save.'),
  spacer(80),

  fieldTable([
    ['Airport Name',    true,  'Text — full official name (e.g. "Kotoka International Airport"). Max 255 characters.'],
    ['City',            true,  'Text — city where the airport is located. Max 255 characters.'],
    ['Country',         true,  'Text — country where the airport is located. Max 255 characters.'],
    ['Active',          true,  'Toggle — set to On to make this airport available for bookings.'],
    ['VAT Rate (%)',    false, 'Number — VAT percentage applied to transfers at this airport (e.g. 15). Overrides the global VAT rate for airport bookings. Min: 0, Max: 100.'],
    ['Linked Branches', false, 'Multi-select — branches that serve this airport. Used for branch-scoped filtering of airport bookings.'],
  ]),
  spacer(120),

  /* ── 2.4 Set up Airport Locations ── */
  h2('2.4   Set Up Airport Locations'),
  spacer(80),
  body('Airport locations are the specific pickup and dropoff points used when booking an airport transfer. There are two types: Terminal locations (inside an airport, e.g. Arrivals Hall) and Area locations (general points outside an airport, e.g. a hotel or neighbourhood).'),
  spacer(60),
  navPath('Operations  >  Airport Transfer  >  Locations  >  Add Location'),
  spacer(60),

  step(1, 'Go to Operations > Airport Transfer > Locations and click Add Location.'),
  step(2, 'Select the Location Type: Terminal (inside an airport) or Area (a general pickup / dropoff point).'),
  step(3, 'If Terminal: select the Airport this terminal belongs to.'),
  step(4, 'If Area: select the Branch responsible for serving this area.'),
  step(5, 'Enter the Location Name (e.g. "Terminal 3 — Arrivals", "East Legon", "Airport Hills Hotel").'),
  step(6, 'If there is a surcharge for this location, enable Has Charge and enter the Charge Amount.'),
  step(7, 'Leave Active On and click Save.'),
  spacer(80),

  fieldTable([
    ['Location Type',  true,  'Select — Terminal (inside an airport) or Area (general point). Controls which linked field appears below.'],
    ['Airport',        false, 'Select — the airport this terminal is located within. Required when Location Type is Terminal.'],
    ['Branch',         false, 'Select — the branch serving this area. Required when Location Type is Area.'],
    ['Location Name',  true,  'Text — descriptive name shown to staff and customers. Max 255 characters.'],
    ['Has Charge',     true,  'Toggle — On if there is an extra fee for this pickup / dropoff point.'],
    ['Charge Amount',  false, 'Number — additional fee for this location. Required when Has Charge is On. Min: 0.'],
    ['Active',         true,  'Toggle — set to On to make this location selectable in bookings.'],
  ]),
  spacer(120),

  /* ── 2.5 Set up Chauffeur Locations ── */
  h2('2.5   Set Up Chauffeur Locations'),
  spacer(80),
  body('Chauffeur locations are the pickup and dropoff points available when creating a chauffeur rental booking. Skip this section if you do not offer chauffeur services.'),
  spacer(60),
  navPath('Operations  >  Chauffeur Rental  >  Locations  >  Add Location'),
  spacer(60),

  step(1, 'Go to Operations > Chauffeur Rental > Locations and click Add Location.'),
  step(2, 'Select the Branch this location belongs to.'),
  step(3, 'Enter a descriptive Location Name.'),
  step(4, 'Enter a Charge if there is a fee for using this location, or leave at 0 for free.'),
  step(5, 'Leave Active On and click Save.'),
  spacer(80),

  fieldTable([
    ['Branch',        true,  'Select — the branch this location belongs to.'],
    ['Location Name', true,  'Text — descriptive name (e.g. "Accra Airport", "Cantonments Office"). Max 255 characters.'],
    ['Charge',        false, 'Number — additional fee for this location. Enter 0 for free. Min: 0.'],
    ['Active',        false, 'Toggle — set to On to make this location selectable. Default: On.'],
  ]),
  spacer(120),

  /* ── 2.6 Create Users ── */
  h2('2.6   Create Users & Assign Roles'),
  spacer(80),
  body('Create a user account for each staff member who needs access to the system. Assign a role at creation time — the role determines what the user can see and do. You can also grant or restrict individual permissions beyond the role defaults.'),
  spacer(60),
  navPath('Administration  >  Users & Access  >  Add New User'),
  spacer(60),

  step(1, 'Go to Administration > Users & Access > Add New User.'),
  step(2, 'Enter the user\'s Full Name and Email Address. The email is used to log in and receive notifications.'),
  step(3, 'Optionally set a Username (alphanumeric, dashes, underscores only). If left blank, the system uses the email.'),
  step(4, 'Set a temporary Password — the user should change this on first login.'),
  step(5, 'Assign a Role. This sets the user\'s base permissions. (See section 1.3 for role descriptions.)'),
  step(6, 'If the user needs specific permissions beyond their role, select them under the Permissions section.'),
  step(7, 'Leave Active toggled On and click Save User.'),
  step(8, 'To assign this user to a branch, follow section 2.7 immediately after.'),
  spacer(80),

  fieldTable([
    ['Full Name',    true,  'Text — user\'s full name displayed throughout the system. Max 255 characters.'],
    ['Email',        true,  'Email — used for login and all system notifications. Must be unique. Max 255 characters.'],
    ['Username',     false, 'Text — alternative login identifier. Must be unique. Alphanumeric, dashes, and underscores only. Max 50 characters.'],
    ['Password',     false, 'Password — temporary password for the user\'s first login. Min 8 characters with letters and numbers. If left blank, the system will prompt the user to set one.'],
    ['Phone',        false, 'Text — optional contact number stored on the user account. Max 20 characters.'],
    ['Active',       false, 'Toggle — set to On to allow this user to log in. Default: On.'],
    ['Roles',        false, 'Multi-select — assign one or more roles to this user. Available roles: Admin, Manager, Staff, Accountant, Viewer.'],
    ['Permissions',  false, 'Multi-select — individual permissions that override or supplement the assigned role. Use sparingly — prefer managing access via roles.'],
  ]),
  note('The Roles field accepts multiple values but assigning more than one role to a single user is generally not recommended. Use custom permissions for fine-grained adjustments instead.'),
  spacer(120),

  /* ── 2.7 Assign Users to Branches ── */
  h2('2.7   Assign Users to a Branch'),
  spacer(80),
  body('Users with the Manager, Staff, or Accountant role should be assigned to one or more branches. Branch assignment controls which data they see — a Manager assigned to the Accra branch sees only Accra rentals, vehicles, and bookings.'),
  body('Admin users typically do not need branch assignments — they have access to all branches by default.'),
  spacer(60),
  navPath('Administration  >  Branches  >  Branch Members'),
  spacer(60),

  step(1, 'Go to Administration > Branches > Branch Members.'),
  step(2, 'Select or search for the branch you want to manage.'),
  step(3, 'Click Assign Members (or the equivalent button on the branch detail page).'),
  step(4, 'Search for the user by name or email and select them.'),
  step(5, 'Click Save. The user is now assigned to this branch.'),
  spacer(80),
  body('Alternatively, from the user\'s profile page (Administration > Users & Access > [User] > Edit), you can assign branches directly on the user record.'),
  note('A user can be assigned to multiple branches. Removing all branch assignments from a non-admin user will cause them to see no data until reassigned.'),
  spacer(120),

  /* ── 2.8 Add Vehicle Categories ── */
  h2('2.8   Add Vehicle Categories'),
  spacer(80),
  body('Vehicle categories group your fleet (e.g. Economy, SUV, Luxury) and set default deposit and fee rules that apply to all vehicles in the category. Create your categories before adding vehicles.'),
  spacer(60),
  navPath('Operations  >  Vehicles  >  Vehicle Categories  >  Add Category'),
  spacer(60),

  step(1, 'Go to Operations > Vehicles > Vehicle Categories and click Add Category.'),
  step(2, 'Enter the Category Name (must be unique) and a short Description.'),
  step(3, 'Set the default Security Deposit for vehicles in this category. Individual vehicles can override this value.'),
  step(4, 'Configure the fee rules: Cancellation Fee, Before Pickup Cancellation Fee, After Pickup Cancellation Fee, and Overdue Fee.'),
  step(5, 'Leave Active On and click Save.'),
  spacer(80),

  fieldTable([
    ['Category Name',                   true,  'Text — unique category name (e.g. "Economy", "SUV", "Executive"). Max 255 characters.'],
    ['Description',                     true,  'Text — brief description shown to staff. Max 500 characters.'],
    ['Icon',                            false, 'Text — icon identifier for UI display. Max 50 characters.'],
    ['Active',                          false, 'Toggle — set to On to make this category available. Default: On.'],
    ['Security Deposit',                false, 'Number — default security deposit amount for vehicles in this category. Min: 0. Can be overridden per vehicle.'],
    ['Cancellation Fee',                false, 'Number — general fee applied when a booking in this category is cancelled.'],
    ['Before Pickup Cancellation Fee',  false, 'Number — fee applied when a booking is cancelled before the pickup date.'],
    ['After Pickup Cancellation Fee',   false, 'Number — fee applied when a booking is cancelled after the vehicle has been picked up.'],
    ['Overdue Fee',                     false, 'Number — daily fee charged when a vehicle in this category is returned late.'],
  ]),
  spacer(80),

  h3('Add Vehicle Features'),
  body('Features are descriptive tags attached to individual vehicles (e.g. GPS Navigation, Air Conditioning, Baby Seat, Bluetooth). Create your feature tags here, then assign them to vehicles during vehicle creation.'),
  spacer(60),
  navPath('Operations  >  Vehicles  >  Vehicle Features  >  Add Feature'),
  spacer(60),
  body('Click Add Feature, enter the Feature Name, and click Save. Features are simple tags — just a name is required. Once saved, they appear in the Features multi-select field when creating or editing a vehicle.'),
  spacer(120),

  /* ── 2.9 Add Rental Vehicles ── */
  h2('2.9   Add Rental Vehicles'),
  spacer(80),
  body('Rental vehicles are the self-drive fleet available for customer rentals. Before adding vehicles, ensure you have created at least one Vehicle Category (section 2.8).'),
  spacer(60),
  navPath('Operations  >  Vehicles  >  Add New Vehicle'),
  spacer(60),

  step(1, 'Go to Operations > Vehicles > Add New Vehicle.'),
  step(2, 'Fill in the Basic Information: Make, Model, Year, Color, License Plate, and Vehicle Name.'),
  step(3, 'Select the Category. This sets the vehicle\'s default deposit and fee rules.'),
  step(4, 'If this vehicle belongs to a specific branch, select it under Branch. Leave blank for a vehicle shared across all branches.'),
  step(5, 'Complete the Specifications: Fuel Type, Transmission, Seats, Engine Size, and Odometer reading.'),
  step(6, 'Set the Daily Rate. This is the base price charged per day of rental.'),
  step(7, 'Optionally override the category Security Deposit for this specific vehicle.'),
  step(8, 'Enter the Insurance Expiry Date and Roadworthy Expiry Date. The system will alert staff when these approach.'),
  step(9, 'Optionally add a VIN, condition notes, description, and tick feature tags.'),
  step(10, 'Toggle Price Visible On if you want this vehicle\'s price shown on the public website.'),
  step(11, 'Set Status to Available and click Save Vehicle.'),
  spacer(80),

  h4('Basic Information'),
  fieldTable([
    ['Vehicle Name',   true,  'Text — display name (e.g. "Toyota Corolla 2022"). Max 255 characters.'],
    ['Make',           true,  'Text — manufacturer (e.g. "Toyota", "Honda"). Max 100 characters.'],
    ['Model',          true,  'Text — model name (e.g. "Corolla", "CR-V"). Max 100 characters.'],
    ['Year',           true,  'Number — manufacturing year. Min: 1900, Max: next calendar year.'],
    ['License Plate',  true,  'Text — vehicle registration number. Must be unique. Max 20 characters.'],
    ['Color',          true,  'Text — primary exterior color. Max 50 characters.'],
    ['VIN',            false, 'Text — Vehicle Identification Number. Must be unique if entered. Max 17 characters.'],
    ['Category',       true,  'Select — the vehicle category. Determines default deposit and fee rules.'],
    ['Branch',         false, 'Select — the branch this vehicle is assigned to. Leave blank for a global / shared vehicle.'],
  ]),
  spacer(80),

  h4('Specifications'),
  fieldTable([
    ['Fuel Type',    true,  'Select — options: Petrol, Diesel, Electric, Hybrid.'],
    ['Transmission', true,  'Select — options: Automatic, Manual.'],
    ['Seats',        true,  'Number — number of passenger seats. Min: 1, Max: 50.'],
    ['Engine Size',  false, 'Text — engine displacement (e.g. "2.0L", "1500cc"). Max 20 characters.'],
    ['Odometer',     false, 'Number — current odometer reading in km at the time of registration. Min: 0.'],
  ]),
  spacer(80),

  h4('Pricing & Deposit'),
  fieldTable([
    ['Daily Rate',        true,  'Number — base price per day of rental. In the branch currency if the vehicle is branch-assigned, otherwise in the global currency. Min: 0.'],
    ['Security Deposit',  false, 'Number — overrides the category default security deposit for this specific vehicle. Leave blank to use the category value.'],
    ['Price Visible',     false, 'Toggle — when On, this vehicle\'s price is displayed on the public website. Default: Off.'],
  ]),
  spacer(80),

  h4('Insurance & Compliance Documents'),
  fieldTable([
    ['Roadworthy Expiry Date', true,  'Date — expiry date of the vehicle\'s roadworthy certificate. The system sends an alert 30 days before this date.'],
    ['Insurance Expiry Date',  true,  'Date — expiry date of the vehicle\'s insurance. The system sends an alert 30 days before this date.'],
    ['Has Valid Insurance',    false, 'Toggle — confirm that the vehicle currently has valid insurance in force.'],
    ['Has Roadworthy Cert',    false, 'Toggle — confirm that the vehicle currently has a valid roadworthy certificate.'],
  ]),
  spacer(80),

  h4('Additional Options'),
  fieldTable([
    ['Features',         false, 'Multi-select checkboxes — select all applicable feature tags (GPS, Air Conditioning, Baby Seat, etc.). Feature tags must be created first in Vehicle Features.'],
    ['Description',      false, 'Textarea — marketing description displayed on the public website listing.'],
    ['Condition Notes',  false, 'Textarea — internal notes about the vehicle\'s current condition. Max 1000 characters.'],
    ['Mark as Featured', false, 'Toggle — when On, this vehicle is highlighted on the public website homepage.'],
    ['Status',           false, 'Select — initial status of the vehicle. Options: Available, Rented, Under Maintenance, Pending Approval, Unavailable, Retired. Default: Available.'],
  ]),
  spacer(120),

  /* ── 2.10 Add Fleet Vehicles ── */
  h2('2.10   Add Fleet Vehicles'),
  spacer(80),
  body('Fleet vehicles are the physical vehicles used for airport transfer and chauffeur rental services — they are managed separately from the self-drive rental fleet. Skip this section if you do not operate airport transfer or chauffeur services.'),
  spacer(60),
  navPath('Operations  >  Fleet Vehicles  >  Add Fleet Vehicle'),
  spacer(60),

  step(1, 'Go to Operations > Fleet Vehicles > Add Fleet Vehicle.'),
  step(2, 'Select the Branch this vehicle is assigned to.'),
  step(3, 'Fill in Make, Model, Year, Color, License Plate, and number of Seats.'),
  step(4, 'Complete the optional Specifications: Fuel Type, Transmission, and Engine.'),
  step(5, 'Enter the Insurance Expiry Date and Roadworthy Expiry Date, and set the insurance and roadworthy toggles accordingly.'),
  step(6, 'If this vehicle will be used for airport transfers, select the Airport Packages it supports.'),
  step(7, 'If this vehicle will be used for chauffeur rental, fill in the Chauffeur Service section: select a Chauffeur Category and enter the Base Price.'),
  step(8, 'If this vehicle has a permanently assigned driver, enable Is Personal Vehicle and select the Default Driver.'),
  step(9, 'Set Status to Available and click Save Fleet Vehicle.'),
  spacer(80),

  h4('Basic Information'),
  fieldTable([
    ['Branch',        true,  'Select — the branch this fleet vehicle belongs to.'],
    ['Make',          true,  'Text — manufacturer (e.g. "Mercedes-Benz"). Max 100 characters.'],
    ['Model',         true,  'Text — model name (e.g. "E-Class", "Sprinter"). Max 100 characters.'],
    ['Year',          true,  'Number — manufacturing year. Min: 1900, Max: 2035.'],
    ['Color',         true,  'Text — primary exterior color. Max 50 characters.'],
    ['License Plate', true,  'Text — registration number. Must be unique. Max 20 characters.'],
    ['Seats',         true,  'Number — passenger capacity. Min: 1, Max: 50.'],
  ]),
  spacer(80),

  h4('Specifications'),
  fieldTable([
    ['Transmission',  false, 'Select — options: Automatic, Manual, Semi-Automatic.'],
    ['Fuel Type',     false, 'Select — options: Petrol, Diesel, Electric, Hybrid.'],
    ['Engine',        false, 'Text — engine description (e.g. "2.0L Turbo"). Max 100 characters.'],
    ['Features',      false, 'Text array — feature tags for this vehicle (free text entries).'],
    ['Description',   false, 'Text — additional notes about this vehicle.'],
    ['Notes',         false, 'Text — internal operational notes.'],
  ]),
  spacer(80),

  h4('Insurance & Compliance'),
  fieldTable([
    ['Has Insurance',          true,  'Toggle — confirm valid insurance is in force.'],
    ['Has Roadworthy',         true,  'Toggle — confirm a valid roadworthy certificate is in force.'],
    ['Insurance Expiry Date',  false, 'Date — insurance document expiry date.'],
    ['Roadworthy Expiry Date', false, 'Date — roadworthy certificate expiry date.'],
  ]),
  spacer(80),

  h4('Service Configuration'),
  fieldTable([
    ['Airport Packages',            false, 'Multi-select — the airport transfer packages this vehicle supports. Packages must be created first.'],
    ['Chauffeur Category',          false, 'Select — the chauffeur service category for this vehicle (e.g. "Economy Chauffeur", "Executive"). Required if configuring chauffeur service.'],
    ['Chauffeur Base Price',        false, 'Number — base price per chauffeur rental booking for this vehicle. Required if Chauffeur Category is set. Min: 0.'],
    ['Is Personal Vehicle',         false, 'Toggle — On if this vehicle is permanently assigned to one driver.'],
    ['Default Driver',              false, 'Select — the driver permanently assigned to this vehicle. Required when Is Personal Vehicle is On.'],
    ['Status',                      false, 'Select — options: Available, On Trip, Under Maintenance, Inactive, Retired. Default: Available.'],
    ['Active',                      false, 'Toggle — set to On to make this vehicle available for assignment. Default: On.'],
  ]),
  spacer(120),

  /* ── 2.11 Add Drivers ── */
  h2('2.11   Add Drivers'),
  spacer(80),
  body('Drivers are the staff assigned to chauffeur and airport transfer jobs. Registering a driver stores their licence, ID documents, and service availability, and enables document expiry tracking with automated alerts.'),
  spacer(60),
  navPath('Operations  >  Drivers  >  Add New Driver'),
  spacer(60),

  step(1, 'Go to Operations > Drivers > Add New Driver.'),
  step(2, 'Enter the driver\'s personal details: First Name, Last Name, Date of Birth, Phone Number, and optionally Email and Address.'),
  step(3, 'Fill in the Licence section: Licence Number, Licence Class, and Licence Expiry Date. Tick Licence Verified once you have physically inspected the document.'),
  step(4, 'Fill in the ID Document section: select the ID Type, enter the ID Number, and the ID Expiry Date.'),
  step(5, 'Under Service Availability, tick Available for Chauffeur and/or Available for Airport to indicate which services this driver can be assigned to.'),
  step(6, 'Optionally add Emergency Contact details.'),
  step(7, 'Upload the Driver Photo, ID Document scan, and Licence Photo using the file upload fields.'),
  step(8, 'Set Status to Available and click Save Driver.'),
  spacer(80),

  h4('Personal Information'),
  fieldTable([
    ['First Name',       true,  'Text — driver\'s given name. Max 255 characters.'],
    ['Last Name',        true,  'Text — driver\'s family name. Max 255 characters.'],
    ['Date of Birth',    true,  'Date — must be a date in the past.'],
    ['Phone Number',     true,  'Text — primary contact number. Must be unique. Max 20 characters.'],
    ['Email',            false, 'Email — optional contact email. Must be unique if entered.'],
    ['Address',          false, 'Text — residential address.'],
    ['City',             false, 'Text — city of residence. Max 100 characters.'],
  ]),
  spacer(80),

  h4('Driving Licence'),
  fieldTable([
    ['Licence Number',       true,  'Text — driving licence number. Must be unique. Max 255 characters.'],
    ['Licence Class',        true,  'Text — licence class or category (e.g. "B", "C"). Max 50 characters.'],
    ['Licence Expiry Date',  true,  'Date — must be a future date. The system sends an alert 30 days before expiry.'],
    ['Licence Verified',     false, 'Checkbox — tick to confirm that staff have physically inspected the original licence document.'],
  ]),
  spacer(80),

  h4('ID Document'),
  fieldTable([
    ['ID Type',       false, 'Select — options: Ghana Card, Passport, Voter\'s ID, Driver\'s Licence, SSNIT, Other.'],
    ['ID Number',     false, 'Text — ID document number. Must be unique if entered. Max 100 characters.'],
    ['ID Expiry Date',false, 'Date — expiry date of the ID document.'],
  ]),
  spacer(80),

  h4('Service Availability & Status'),
  fieldTable([
    ['Available for Chauffeur', false, 'Checkbox — tick if this driver can be assigned to chauffeur rental bookings.'],
    ['Available for Airport',   false, 'Checkbox — tick if this driver can be assigned to airport transfer bookings.'],
    ['Status',                  false, 'Select — current driver status. Options: Available, On Trip, Off Duty, Suspended, Inactive. Default: Available.'],
    ['Notes',                   false, 'Text — internal notes about this driver.'],
    ['Active',                  false, 'Toggle — set to On to allow this driver to be assigned to bookings. Default: On.'],
  ]),
  spacer(80),

  h4('Emergency Contact'),
  fieldTable([
    ['Emergency Contact Name',     false, 'Text — name of the emergency contact person. Max 255 characters.'],
    ['Emergency Contact Phone',    false, 'Text — phone number of the emergency contact. Max 20 characters.'],
    ['Emergency Contact Relation', false, 'Text — relationship to the driver (e.g. "Spouse", "Parent"). Max 100 characters.'],
  ]),
  spacer(80),

  h4('Document Uploads'),
  fieldTable([
    ['Driver Photo',   false, 'File — passport-style photo of the driver. Formats: JPG, PNG, WebP. Max 10 MB.'],
    ['ID Document',    false, 'File — scan or clear photo of the ID document. Formats: JPG, PNG, WebP, PDF. Max 10 MB.'],
    ['Licence Photo',  false, 'File — scan or clear photo of the driving licence. Formats: JPG, PNG, WebP, PDF. Max 10 MB.'],
  ]),
  note('Document expiry alerts for drivers are sent automatically by the system 30 days before the licence or ID document expires. Ensure expiry dates are entered accurately.'),
  spacer(200),
  endMarker(2),
];

/* ════════════════════════════════════════════════
   PART 3  —  CUSTOMER MANAGEMENT
   ════════════════════════════════════════════════ */
const part3 = [
  pb(),
  partHeading('PART 3  —  CUSTOMER MANAGEMENT'),
  spacer(200),
  body('This part covers everything related to managing the customer database — creating profiles, uploading documents, verifying identity, tracking licence expiry, and blacklisting. A complete and verified customer record is required before a rental can be created.'),
  spacer(80),

  /* 3.1 */
  h2('3.1   Adding a Customer Manually'),
  spacer(80),
  body('Customers can register themselves on the public website, or staff can register them manually for walk-in and phone bookings. The form is divided into five sections — complete all sections for the customer\'s profile to reach Verified status.'),
  spacer(60),
  navPath('Operations  >  Customers  >  Add New Customer'),
  spacer(60),

  step(1, 'Go to Operations > Customers > Add New Customer.'),
  step(2, 'Fill in Personal Information: Full Name, Email, Phone, and Address are required. Alt Phone and Date of Birth are optional.'),
  step(3, 'Fill in Licence & Identification: enter the Licence Number, Licence Expiry Date, ID Type, and ID Number.'),
  step(4, 'Upload Documents: upload the driver\'s licence images (front and back) and a clear photo or scan of the ID document.'),
  step(5, 'Optionally complete the Emergency Contact section. If any field is filled in, all three fields become required.'),
  step(6, 'Add any internal Notes in the Additional Information section, if needed.'),
  step(7, 'Click Save Customer. The customer is created with a status of Incomplete or Pending Review depending on how much information was provided.'),
  spacer(80),

  h4('Section 1 — Personal Information'),
  fieldTable([
    ['Full Name',      true,  'Text — customer\'s full name as it appears on their ID. Max 255 characters.'],
    ['Email Address',  true,  'Email — used for booking confirmations and payment links. Must be unique across all customers.'],
    ['Phone Number',   true,  'Text — primary contact number. Accepts +, spaces, dashes, and parentheses. Max 20 characters.'],
    ['Alt Phone',      false, 'Text — secondary contact number. Same format as Phone. Max 20 characters.'],
    ['Date of Birth',  false, 'Date — must be in the past. Used for age verification.'],
    ['Address',        true,  'Textarea — full residential or correspondence address.'],
  ]),
  spacer(80),

  h4('Section 2 — Licence & Identification'),
  fieldTable([
    ['Licence Number',      true, 'Text — driving licence number exactly as printed on the document. Must be unique across all customers. Max 255 characters.'],
    ['Licence Expiry Date', true, 'Date — expiry date on the driving licence. Must be a future date — the system will not allow registering a customer with an already-expired licence.'],
    ['ID Type',             true, 'Select — type of government ID provided. Options: Ghana Card, Passport, Voter ID, Driver\'s Licence, NHIS Card, Other.'],
    ['ID Number',           true, 'Text — number on the selected ID document. Max 50 characters.'],
  ]),
  spacer(80),

  h4('Section 3 — Document Uploads'),
  body('Documents are uploaded separately from the form fields. Staff can skip uploads at registration and upload later from the customer\'s profile page, but documents must be present before a rental is created.'),
  spacer(60),
  table2([
    ['Upload', 'Details'],
    ['Driver\'s Licence',  'Upload front AND back of the licence. Max 2 files. Formats: JPEG, PNG, WebP. Max 5 MB per file.'],
    ['ID Document',        'Upload a clear scan or photo of the ID selected under ID Type. Max 1 file. Formats: JPEG, PNG, WebP. Max 5 MB.'],
    ['Other Documents',    'Additional supporting documents (e.g. proof of address, corporate authorisation). Max 5 files. Formats: JPEG, PNG, WebP, PDF. Max 10 MB each.'],
  ]),
  spacer(80),

  h4('Section 4 — Emergency Contact (Optional)'),
  fieldTable([
    ['Contact Name',         false, 'Text — name of the emergency contact person. Max 255 characters. If any emergency contact field is filled, all three become required.'],
    ['Contact Phone',        false, 'Text — emergency contact phone number. Max 20 characters.'],
    ['Relationship',         false, 'Text — relationship to the customer (e.g. Spouse, Parent, Sibling). Max 100 characters.'],
  ]),
  spacer(80),

  h4('Section 5 — Additional Information'),
  fieldTable([
    ['Notes',             false, 'Textarea — internal notes visible to staff only. Not shown to the customer.'],
    ['Is Blacklisted',    false, 'Toggle — enables blacklisting at registration. Not recommended for new customers; use the blacklist workflow after registration instead (see section 3.6).'],
    ['Blacklist Reason',  false, 'Textarea — reason for blacklisting. Required when Is Blacklisted is On.'],
  ]),
  spacer(80),
  note('A customer\'s email address and licence number must both be unique across the entire system. The system will reject the form if either is already in use by another customer.'),
  spacer(120),

  /* 3.2 */
  h2('3.2   Viewing a Customer Profile'),
  spacer(80),
  body('The customer profile page gives a full view of a customer\'s personal details, documents, rental history, and current status. It is the primary workspace for managing a customer record.'),
  spacer(60),
  navPath('Operations  >  Customers  >  All Customers  >  [Customer Name]'),
  spacer(60),
  body('Click any customer\'s name in the All Customers list to open their profile. The page uses a two-column layout.'),
  spacer(80),

  h3('Left Column — Identity & Documents'),
  table2([
    ['Panel', 'What It Shows'],
    ['Status & Stats',        'Customer avatar (initials), full name, profile status badge, and three counters: Total Rentals, Completed, Active. The blacklist dropdown is also here.'],
    ['Licence & ID',          'Licence number, licence expiry date (colour-coded: red = expired, amber = expiring within 30 days, green = valid), ID type, and ID number.'],
    ['Documents',             'Thumbnail previews of uploaded licence images and ID document. Click any thumbnail to view the full image. Shows "No licence uploaded" or "No ID uploaded" if documents are missing.'],
  ]),
  spacer(80),

  h3('Right Column — Details & History'),
  table2([
    ['Panel', 'What It Shows'],
    ['Alert Banners',       'Red banner if licence is expired. Amber banner if licence expires within 30 days. Red banner showing blacklist reason if the customer is blacklisted.'],
    ['Personal Information','Full Name, Email, Phone, Alt Phone, Address, Date of Birth, Member Since date, and any branch assignments (shown as badges).'],
    ['Emergency Contact',   'Contact name, phone, and relationship — only shown if emergency contact was provided.'],
    ['Notes',               'Internal staff notes — read-only on the detail page. Click Edit to update.'],
    ['Rental History',      'Table of all rentals for this customer. Columns: Vehicle, Start Date, End Date, Amount, Status, View link. Status is colour-coded by rental state.'],
  ]),
  spacer(80),

  h3('Action Buttons (Top Right)'),
  table2([
    ['Button', 'What It Does'],
    ['Profile Status Badge',   'Displays the current profile status (Incomplete, Pending Review, Verified, Rejected). Not a clickable button.'],
    ['Verify Customer',        'Opens the verification modal. Only shown when profile status is not yet Verified. Requires the Edit Customers permission.'],
    ['Request Doc Re-upload',  'Sends the customer an email with a secure link to re-upload their licence or ID documents without logging in. Useful when documents are unclear or expired.'],
    ['Edit',                   'Opens the edit form to update any profile fields.'],
  ]),
  spacer(120),

  /* 3.3 */
  h2('3.3   Customer Profile Status'),
  spacer(80),
  body('Every customer has a profile status that tracks the completeness and verification of their record. The status is shown as a badge on the customer\'s profile and in the All Customers list. Rentals can only be confirmed for customers with a Verified profile.'),
  spacer(60),
  table3([
    ['Status', 'Badge Colour', 'Meaning'],
    ['Incomplete',      'Grey',   'Required fields are missing or documents have not been uploaded. The customer cannot rent until the profile is completed.'],
    ['Pending Review',  'Amber',  'All required fields and documents are present. The profile is waiting for a staff member to manually verify the customer\'s identity.'],
    ['Verified',        'Green',  'A staff member has reviewed and confirmed the customer\'s documents and identity. The customer is approved to rent.'],
    ['Rejected',        'Red',    'A staff member has reviewed the profile and rejected the customer — typically due to a document mismatch or fraud concern.'],
  ], 20, 16, 64),
  spacer(80),
  note('The profile status moves to Pending Review automatically once all required fields and at least one document from each collection are present. It does not advance to Verified automatically — a staff member must manually click Verify Customer.'),
  spacer(120),

  /* 3.4 */
  h2('3.4   Verifying a Customer'),
  spacer(80),
  body('Verification is a manual step in which a staff member confirms that the customer\'s submitted documents match the information on their profile. A customer must be Verified before their rental can move from Confirmed to Active (picked up).'),
  spacer(60),
  navPath('Customer Profile  >  Verify Customer button (top right)'),
  spacer(60),

  step(1, 'Open the customer\'s profile page.'),
  step(2, 'Check that the licence and ID document thumbnails are present and clearly legible. If they are not, click Request Doc Re-upload to ask the customer to resubmit (see section 3.5).'),
  step(3, 'Confirm that the Licence Number, Licence Expiry Date, ID Type, and ID Number on the profile match the uploaded documents.'),
  step(4, 'Click Verify Customer in the top-right action area.'),
  step(5, 'A confirmation modal appears listing any fields that are missing. If everything is in order, click Confirm Verification.'),
  step(6, 'The profile status changes to Verified and the verification timestamp and verifying staff member\'s name are recorded.'),
  spacer(80),
  note('You can verify a customer even if the warning modal shows missing fields — however this is not recommended. Ensure the licence expiry date is in the future before verifying; a customer with an expired licence should not be marked Verified.'),
  spacer(120),

  /* 3.5 */
  h2('3.5   Requesting a Document Re-upload'),
  spacer(80),
  body('If a customer\'s uploaded documents are unclear, expired, or mismatched, you can send them a secure re-upload link by email. The customer clicks the link and uploads new files without needing to log in to the system.'),
  spacer(60),
  navPath('Customer Profile  >  Request Doc Re-upload button (top right)'),
  spacer(60),

  step(1, 'Open the customer\'s profile page.'),
  step(2, 'Click Request Doc Re-upload.'),
  step(3, 'The system sends an email to the customer\'s registered email address containing a secure, time-limited upload link.'),
  step(4, 'The customer clicks the link and is taken to a page where they can upload new licence and ID document images.'),
  step(5, 'Once the customer uploads new files, the documents section on their profile updates automatically. Review and re-verify as needed.'),
  spacer(80),
  note('The re-upload link expires after a set period. If the customer misses the deadline, click Request Doc Re-upload again to send a new link.'),
  spacer(120),

  /* 3.6 */
  h2('3.6   Blacklisting a Customer'),
  spacer(80),
  body('Blacklisting blocks a customer from making new bookings. Their existing active rentals are not cancelled automatically. A reason must always be provided when blacklisting. The blacklist can be lifted at any time by the same process.'),
  spacer(60),
  navPath('Customer Profile  >  Status dropdown  >  Blacklist Customer'),
  spacer(60),

  h3('To Blacklist'),
  step(1, 'Open the customer\'s profile page.'),
  step(2, 'Click the status dropdown in the top-left panel (where the customer\'s name and stats appear).'),
  step(3, 'Select Blacklist Customer. A modal appears asking for a reason.'),
  step(4, 'Enter a clear reason in the Blacklist Reason field (required — cannot be left blank).'),
  step(5, 'Click Confirm. The customer\'s status changes to Blacklisted and a red banner displays the reason on their profile.'),
  spacer(80),

  h3('To Remove from Blacklist'),
  step(1, 'Open the blacklisted customer\'s profile.'),
  step(2, 'Click the status dropdown and select Remove from Blacklist.'),
  step(3, 'The blacklist is lifted immediately — no confirmation modal appears. The customer can make new bookings again.'),
  spacer(80),
  note('A blacklisted customer\'s reason is stored on the profile and visible to all staff. When a blacklisted customer attempts to book online, their booking is automatically rejected. Always document the reason clearly so other staff understand the context.'),
  spacer(120),

  /* 3.7 */
  h2('3.7   Licence Expiry Tracking'),
  spacer(80),
  body('The system automatically tracks driving licence expiry dates and flags customers whose licences are approaching or have already passed their expiry date. There are dedicated sidebar views for quick access.'),
  spacer(80),

  h3('Licence Status States'),
  table3([
    ['State', 'Badge Colour', 'Meaning & Required Action'],
    ['Valid',          'Green', 'Licence expiry date is more than 30 days away. No action required.'],
    ['Expiring Soon',  'Amber', 'Licence expires within the next 30 days. Remind the customer to renew before their next rental. Visible in Operations > Customers > License Expiring Soon.'],
    ['Expired',        'Red',   'Licence expiry date has passed. Customer cannot be verified or allowed to rent until a new licence is uploaded and the expiry date is updated. Visible in Operations > Customers > License Expired.'],
  ], 18, 14, 68),
  spacer(80),

  h3('Viewing Expiry Lists'),
  table2([
    ['Sidebar Item', 'What It Shows'],
    ['License Expiring Soon', 'All customers whose driving licence expires within the next 30 days. Review this list regularly and contact customers to arrange renewal.'],
    ['License Expired',       'All customers with a licence that has already expired. These customers cannot rent until their licence is renewed and their profile is updated.'],
  ]),
  spacer(80),

  h3('Updating an Expired Licence'),
  step(1, 'Open the customer\'s profile and click Edit.'),
  step(2, 'Update the Licence Expiry Date to the new expiry date on the renewed licence.'),
  step(3, 'Update the Licence Number if the new licence has a different number.'),
  step(4, 'Click Save.'),
  step(5, 'Go back to the profile and upload an image of the new licence using the document upload section.'),
  step(6, 'Re-verify the customer by clicking Verify Customer (see section 3.4).'),
  spacer(80),
  note('The automated overdue alert system and licence expiry notification emails are sent to staff — not directly to the customer. Staff are responsible for contacting customers about upcoming renewals.'),
  spacer(200),
  endMarker(3),
];

/* ════════════════════════════════════════════════
   PART 4  —  RENTAL OPERATIONS
   ════════════════════════════════════════════════ */
const part4 = [
  pb(),
  partHeading('PART 4  —  RENTAL OPERATIONS'),
  spacer(200),
  body('This part covers the complete rental workflow — from creating a booking through pickup, active management, return, and completion. It also covers quotes, overdue handling, damage settlement, deposits, and invoicing. Managers can perform all operations in this section.'),
  spacer(80),

  /* 4.1 */
  h2('4.1   Rental Lifecycle Overview'),
  spacer(80),
  body('Every rental moves through a defined sequence of statuses. Understanding these states is essential for knowing which actions are available at each point.'),
  spacer(60),
  table3([
    ['Status',     'Colour', 'Meaning & Next Action'],
    ['Pending',    'Amber',  'Booking created but not yet confirmed. Awaiting staff review. Action: Confirm Booking.'],
    ['Confirmed',  'Blue',   'Staff has confirmed the booking. Vehicle is reserved. Action: Process Pickup when customer arrives.'],
    ['Active',     'Green',  'Customer has the vehicle. Pickup inspection recorded. Action: Extend, add charges, or switch vehicle as needed.'],
    ['Overdue',    'Red',    'Return date has passed and vehicle has not been returned. Action: Contact customer. Return can still be processed.'],
    ['Returned',   'Purple', 'Customer has returned the vehicle. Inspection recorded. Action: Approve Return to complete the rental.'],
    ['Completed',  'Grey',   'Rental fully settled. No further actions possible.'],
    ['Cancelled',  'Dark',   'Booking cancelled before pickup. Deposit refund may apply.'],
  ], 18, 14, 68),
  spacer(80),
  note('Only Admin users can edit a rental\'s core details (dates, vehicle, customer) after creation. Managers can perform all operational actions — pickup, return, charges, extensions — but cannot edit the underlying booking record.'),
  spacer(120),

  /* 4.2 */
  h2('4.2   Creating a Rental (In-Store Booking)'),
  spacer(80),
  body('Use this flow when a customer is present in-store, on the phone, or when staff is creating a booking on behalf of an existing customer. The customer must already exist in the system with a Verified profile.'),
  spacer(60),
  navPath('Operations  >  Rentals  >  New Booking'),
  spacer(60),

  step(1, 'Click New Booking from the sidebar or the Rentals dashboard.'),
  step(2, 'Complete Booking Details — select the customer, vehicle, branch, and booking source.'),
  step(3, 'Set Dates & Times — choose pickup date, pickup time, return date, and return time.'),
  step(4, 'Select Locations — choose the pickup location and dropoff location.'),
  step(5, 'Apply Discounts and add internal Notes (optional).'),
  step(6, 'Record any payment collected at booking time if applicable.'),
  step(7, 'Click Save Booking. The rental is created with status Pending.'),
  spacer(80),

  h3('Section 1 — Booking Details'),
  fieldTable([
    ['Customer',       true,  'Searchable dropdown — type the customer\'s name or email. The customer must have a Verified profile. For new customers, use New Booking (section 4.3).'],
    ['Vehicle',        true,  'Searchable dropdown — filtered to available vehicles for the selected dates and branch. Shows make, model, and licence plate.'],
    ['Branch',         true,  'The operating branch for this rental. Controls which locations, pricing, and currency apply.'],
    ['Booking Source', true,  'Enum — Walk In, Phone, Online, Referral, Corporate. Tracks how the customer engaged the business.'],
  ]),
  spacer(60),

  h3('Section 2 — Dates & Times'),
  fieldTable([
    ['Pickup Date',  true, 'Date picker — the date the customer will collect the vehicle.'],
    ['Pickup Time',  true, 'Time picker — the time the vehicle will be handed over.'],
    ['Return Date',  true, 'Date picker — the agreed return date. Must be on or after Pickup Date.'],
    ['Return Time',  true, 'Time picker — the agreed return time. Total rental duration and cost are calculated from these four values.'],
  ]),
  spacer(60),

  h3('Section 3 — Locations'),
  fieldTable([
    ['Pickup Location',  true, 'Dropdown — the branch location where the customer collects the vehicle. Locations with a surcharge show the charge amount next to the name.'],
    ['Dropoff Location', true, 'Dropdown — the return location. Can differ from pickup. Surcharges apply per location and are added to the rental total.'],
  ]),
  spacer(60),

  h3('Section 4 — Discounts & Notes'),
  fieldTable([
    ['Discount Type',  false, 'Enum — None, Percentage, or Fixed Amount. Must be selected before entering a value.'],
    ['Discount Value', false, 'Numeric — enter the percentage (e.g. 10 for 10%) or the fixed currency amount. Only visible when Discount Type is not None.'],
    ['Coupon Code',    false, 'Text — enter a valid promotional code. Validated in real time; errors display inline.'],
    ['Notes',          false, 'Textarea — internal notes visible to staff only. Not shown to the customer.'],
  ]),
  spacer(60),

  h3('Section 5 — Payment at Booking'),
  fieldTable([
    ['Payment Method',    false, 'Enum — Cash, Mobile Money, Bank Transfer, Offline Transfer. Leave blank if no payment is collected at booking time.'],
    ['Payment Reference', false, 'Text — transaction reference number (e.g. mobile money ID). Shown only when a payment method is selected.'],
    ['Amount Paid',       false, 'Numeric — amount collected. Can be a partial or full payment. Added to any future payments.'],
  ]),
  spacer(80),
  note('The pricing summary panel updates in real time as you select dates, locations, and discounts. Review the Total Amount before saving.'),
  spacer(120),

  /* 4.3 */
  h2('4.3   New Booking with a New Customer'),
  spacer(80),
  body('Use this form when the customer does not yet exist in the system. It creates the customer record and the rental booking in one flow. The New Booking form has two tabs at the top — click New Customer to access these fields.'),
  spacer(60),
  navPath('Operations  >  Rentals  >  New Booking  >  New Customer tab'),
  spacer(60),

  h3('Customer — Personal Information'),
  fieldTable([
    ['Full Name',     true,  'Text — customer\'s full legal name as it appears on their ID.'],
    ['Email',         true,  'Email — used for notifications and payment links. Must be unique across all customers.'],
    ['Phone',         true,  'Text — primary contact number.'],
    ['Alt Phone',     false, 'Text — alternative contact number.'],
    ['Date of Birth', false, 'Date picker — optional but recommended for identity verification.'],
    ['Address',       true,  'Textarea — residential address.'],
  ]),
  spacer(60),

  h3('Customer — Licence & Identification'),
  fieldTable([
    ['Licence Number',       true, 'Text — driving licence number. Must be unique across all customers.'],
    ['Licence Expiry Date',  true, 'Date picker — the expiry date printed on the licence. The system flags customers with expired or soon-to-expire licences.'],
    ['ID Type',              true, 'Dropdown — National ID, Passport, Voters ID, or NHIS Card.'],
    ['ID Number',            true, 'Text — the number printed on the chosen ID document.'],
  ]),
  spacer(60),

  h3('Customer — Document Uploads'),
  fieldTable([
    ['Licence Image (Front)', false, 'Image upload — clear photo or scan of the front of the driving licence.'],
    ['Licence Image (Back)',  false, 'Image upload — clear photo or scan of the back of the driving licence.'],
    ['ID Document',           false, 'Image upload — clear photo or scan of the ID document.'],
  ]),
  spacer(60),

  h3('Customer — Emergency Contact (Optional)'),
  body('If any emergency contact field is filled in, all three fields become required.'),
  spacer(40),
  fieldTable([
    ['Emergency Contact Name',         false, 'Text — full name of the emergency contact.'],
    ['Emergency Contact Phone',        false, 'Text — phone number for the emergency contact.'],
    ['Emergency Contact Relationship', false, 'Text — relationship to the customer (e.g. Spouse, Parent, Sibling).'],
  ]),
  spacer(80),
  note('The customer profile is created with status Incomplete or Pending Review depending on how much information was provided. You can verify the customer later from their profile before confirming the rental.'),
  spacer(120),

  /* 4.4 */
  h2('4.4   Quote Requests'),
  spacer(80),
  body('Quote requests are price enquiries submitted by customers through the website. They are not confirmed rentals. Staff can convert a quote into a rental booking or decline it.'),
  spacer(60),
  navPath('Operations  >  Rentals  >  Quote Requests'),
  spacer(60),

  table2([
    ['Action',            'Description'],
    ['View Quote',         'Click any quote to see the requested dates, vehicle, customer details, and the estimated price shown to the customer.'],
    ['Convert to Rental',  'Opens the New Booking form pre-filled with the quote\'s details. Review and adjust, then save to create a Pending rental.'],
    ['Decline Quote',      'Marks the quote as declined. The customer can be notified by email if the notification setting is enabled.'],
  ]),
  spacer(80),
  note('Quotes expire automatically after a configurable period set in Settings > Rental. Expired quotes are archived and cannot be converted. Process quotes promptly to avoid losing the booking.'),
  spacer(120),

  /* 4.5 */
  h2('4.5   Confirming a Pending Booking'),
  spacer(80),
  body('A rental in Pending status has been created but not yet reviewed by staff. Confirming reserves the vehicle and signals to the customer that their booking is accepted. A confirmation email is sent automatically.'),
  spacer(60),
  navPath('Operations  >  Rentals  >  Pending Bookings  >  [Rental]  >  Confirm Booking'),
  spacer(60),

  step(1, 'Open the rental from the Pending Bookings list.'),
  step(2, 'Review the booking — check that the customer has a Verified profile and the vehicle is available.'),
  step(3, 'Click Confirm Booking in the action bar at the top right.'),
  step(4, 'The rental status changes to Confirmed and a booking confirmation email is sent to the customer.'),
  spacer(80),
  note('You can confirm a booking even if the customer profile is still Incomplete, but resolve the profile status before processing pickup. A customer with an expired licence should not proceed to pickup.'),
  spacer(120),

  /* 4.6 */
  h2('4.6   Processing Pickup'),
  spacer(80),
  body('Process Pickup is performed when the customer arrives and takes possession of the vehicle. It records the vehicle\'s condition at handover and moves the rental to Active status. This action cannot be undone.'),
  spacer(60),
  navPath('Operations  >  Rentals  >  Active Rentals  >  [Rental]  >  Process Pickup'),
  spacer(60),

  step(1, 'Open the confirmed rental and click Process Pickup.'),
  step(2, 'Record the Fuel Level at handover using the gauge selector.'),
  step(3, 'Record the Mileage Out — the current odometer reading in kilometres.'),
  step(4, 'Describe the General Condition of the vehicle at handover.'),
  step(5, 'If pre-existing damage is present, toggle Has Pre-existing Damage and complete the damage fields.'),
  step(6, 'Record any payment collected at pickup if applicable.'),
  step(7, 'Click Confirm Pickup. The rental moves to Active status.'),
  spacer(80),

  h3('Pickup Inspection Fields'),
  fieldTable([
    ['Fuel Level',              true,  'Visual gauge — select from: Empty, Quarter, Half, Three-Quarter, Full. This level is compared on return to calculate any fuel charge.'],
    ['Mileage Out',             true,  'Numeric — odometer reading in kilometres at handover. Compared with Mileage In on return.'],
    ['General Condition',       true,  'Textarea — describe the overall state of the vehicle. Note any pre-existing marks, dirt, or mechanical observations.'],
    ['Has Pre-existing Damage', false, 'Toggle — switch on if there is visible damage to document at pickup. Reveals the damage detail fields.'],
    ['Damage Type',             false, 'Enum (shown when damage is toggled on) — Paint Damage, Body Damage, Interior Damage, Bumper Damage, Mirror Damage, Windshield Damage, Tyre Damage, Other.'],
    ['Damage Severity',         false, 'Enum — Minor, Moderate, Severe. Use Minor for cosmetic marks; Severe for structural damage.'],
    ['Damage Description',      false, 'Textarea — describe the exact location and nature of the damage (e.g. "10 cm scratch on left rear door").'],
  ]),
  spacer(60),

  h3('Payment at Pickup'),
  fieldTable([
    ['Payment Method',    false, 'Enum — Cash, Mobile Money, Bank Transfer, Offline Transfer.'],
    ['Payment Reference', false, 'Text — transaction reference number.'],
    ['Amount Paid',       false, 'Numeric — amount collected at pickup. Added to any earlier payment from booking time.'],
  ]),
  spacer(80),
  note('The pickup inspection is a legal record of the vehicle\'s condition at handover. Documenting pre-existing damage protects both the business and the customer from disputes at return.'),
  spacer(120),

  /* 4.7 */
  h2('4.7   Adding Charges to an Active Rental'),
  spacer(80),
  body('Additional charges can be applied at any point during an active rental — for extras such as fuel top-up, cleaning fees, child seat hire, or penalties. These are added to the rental balance and appear on the invoice.'),
  spacer(60),
  navPath('Rental Detail  >  Additional Charges tab  >  Add Charge'),
  spacer(60),

  fieldTable([
    ['Charge Type',  true,  'Dropdown — select from the configured charge types for the branch (e.g. Fuel Top-up, Cleaning Fee, Child Seat, Extra Driver, Penalty, Other). Each type has a preset label and optional default price.'],
    ['Amount',       true,  'Numeric — the charge amount. Pre-filled from the charge type default if configured; can be overridden.'],
    ['Description',  false, 'Text — notes explaining this specific charge (e.g. "Full tank refill at return, 45 litres"). Appears on the customer invoice.'],
  ]),
  spacer(80),
  note('Use the Description field to give the customer a clear explanation of each charge. Unexplained charges on an invoice create disputes.'),
  spacer(120),

  /* 4.8 */
  h2('4.8   Extending a Rental'),
  spacer(80),
  body('If a customer needs the vehicle for longer than originally booked, use Extend Rental to push the return date forward. The system recalculates the total and shows a pricing preview before confirming.'),
  spacer(60),
  navPath('Rental Detail  >  Extend Rental button'),
  spacer(60),

  step(1, 'Open the active rental and click Extend Rental.'),
  step(2, 'Select the new return date.'),
  step(3, 'Select the new return time.'),
  step(4, 'Review the pricing preview — shows the original amount, the extension cost, and the new total.'),
  step(5, 'Click Confirm Extension. The return date updates and the balance is adjusted.'),
  spacer(80),
  note('Extension is only available while the rental is Active. Only the return date and time change — all other details remain the same. Notify the customer of the new balance if a payment is due.'),
  spacer(120),

  /* 4.9 */
  h2('4.9   Switching the Vehicle'),
  spacer(80),
  body('If the original vehicle becomes unavailable during an active rental (breakdown, maintenance), use Switch Vehicle to assign a replacement. The change is logged and pricing is recalculated from the switch date if the rates differ.'),
  spacer(60),
  navPath('Rental Detail  >  Switch Vehicle button'),
  spacer(60),

  step(1, 'Open the active rental and click Switch Vehicle.'),
  step(2, 'Select the replacement vehicle — only available vehicles in the same branch are shown.'),
  step(3, 'Review the pricing comparison between the original and replacement vehicle.'),
  step(4, 'Click Confirm Switch. The rental is updated and pricing is recalculated from the switch date.'),
  spacer(80),
  note('The vehicle switch is recorded in the rental history. Note any condition details of the replacement vehicle in the rental notes field — a new pickup inspection for the replacement vehicle is not created automatically.'),
  spacer(120),

  /* 4.10 */
  h2('4.10   Processing Return & Inspection'),
  spacer(80),
  body('Process Return is performed when the customer hands back the vehicle. It records the return condition and moves the rental to Returned status, ready for final approval. This step applies to both Active and Overdue rentals.'),
  spacer(60),
  navPath('Rental Detail  >  Process Return button'),
  spacer(60),

  step(1, 'Open the rental and click Process Return.'),
  step(2, 'Record the Fuel Level at return. If below the pickup level, a fuel surcharge can be applied via Additional Charges.'),
  step(3, 'Record the Mileage In — current odometer reading.'),
  step(4, 'Describe the Return Condition.'),
  step(5, 'If new damage is found, toggle Has New Damage and complete the damage fields.'),
  step(6, 'Record any final payment collected at return if applicable.'),
  step(7, 'Click Confirm Return. The rental moves to Returned status.'),
  spacer(80),

  h3('Return Inspection Fields'),
  fieldTable([
    ['Fuel Level at Return',  true,  'Visual gauge — record the fuel level at return. A fuel surcharge for a shortfall is applied separately via Additional Charges.'],
    ['Mileage In',            true,  'Numeric — odometer reading at return. The difference from Mileage Out is the total distance driven.'],
    ['Return Condition',      true,  'Textarea — describe the vehicle condition at return. Note any new damage, cleanliness, or other observations compared with pickup.'],
    ['Has New Damage',        false, 'Toggle — switch on if damage is found that was not present at pickup. Reveals the damage detail fields.'],
    ['Damage Type',           false, 'Enum — Paint Damage, Body Damage, Interior Damage, Bumper Damage, Mirror Damage, Windshield Damage, Tyre Damage, Other.'],
    ['Damage Severity',       false, 'Enum — Minor, Moderate, Severe.'],
    ['Damage Description',    false, 'Textarea — describe the damage in detail and its location on the vehicle.'],
  ]),
  spacer(60),

  h3('Early Return Behaviour'),
  table3([
    ['Scenario',                     'Pricing Behaviour',                                                         'Action'],
    ['Returned on time',              'No adjustment. Balance is as originally calculated.',                       'Approve Return.'],
    ['Returned early (standard)',     'Full booked period is charged regardless of actual return date.',           'Approve Return. No pricing change.'],
    ['Returned early (Force Settle)', 'Admin overrides and charges only for the actual days used.',                'Enable Force Settle when approving (see 4.11).'],
    ['Returned late (overdue)',       'Additional daily rate charged for each overdue day automatically.',         'Process Return normally. Overdue charges are calculated by the system.'],
  ], 28, 34, 38),
  spacer(120),

  /* 4.11 */
  h2('4.11   Approving Return & Completing'),
  spacer(80),
  body('After the return inspection, a manager or admin must review and approve the return to move the rental to Completed. Once completed, the rental is locked and no further changes are possible.'),
  spacer(60),
  navPath('Rental Detail  >  Approve Return button  (status: Returned)'),
  spacer(60),

  step(1, 'Open the returned rental and review the return inspection details — fuel level, mileage, condition, and any damage noted.'),
  step(2, 'Check the payment summary and verify the balance is correct.'),
  step(3, 'Collect any remaining balance before approving, or use Send Payment Link (section 4.15) if the customer is not present.'),
  step(4, 'Click Approve Return. A confirmation modal appears.'),
  step(5, 'If the customer returned early and you wish to charge only for the actual period used, enable Force Settle in the modal. Otherwise leave it off.'),
  step(6, 'Click Confirm. The rental status changes to Completed.'),
  spacer(60),
  fieldTable([
    ['Force Settle', false, 'Toggle in the Approve Return modal — when on, the system recalculates the rental total based on the actual return date, not the originally booked return date. Use for early returns when you agree to charge only for the days used. Admin permission only.'],
  ]),
  spacer(80),
  note('Ensure all charges, damage records, and payments are finalised before approving. Completion is irreversible.'),
  spacer(120),

  /* 4.12 */
  h2('4.12   Managing Overdue Rentals'),
  spacer(80),
  body('A rental becomes Overdue automatically when the return date passes and the vehicle has not been returned. Staff receive automated overdue alert notifications. Overdue rentals continue to accrue daily charges.'),
  spacer(60),
  navPath('Operations  >  Rentals  >  Overdue Rentals'),
  spacer(60),

  step(1, 'Open the overdue rental from Operations > Rentals > Overdue Rentals.'),
  step(2, 'Note the number of overdue days and the accruing outstanding balance.'),
  step(3, 'Contact the customer using their registered phone number.'),
  step(4, 'If payment is needed, click Send Payment Link (section 4.15) to send a payment request to their email.'),
  step(5, 'When the vehicle is returned, use Process Return normally (section 4.10). Overdue charges are calculated automatically.'),
  spacer(80),
  note('The daily overdue alert notification (if enabled in Settings > Notifications) is sent to the assigned rental manager and admins each day a rental remains overdue.'),
  spacer(120),

  /* 4.13 */
  h2('4.13   Security Deposits'),
  spacer(80),
  body('Security deposits are collected at booking time or pickup and returned to the customer on completion with no outstanding issues. The deposit is tracked separately from the rental balance.'),
  spacer(60),

  h3('Deposit Lifecycle'),
  table3([
    ['Stage',     'Trigger',                                              'How to Do It'],
    ['Collected', 'Customer pays deposit at booking or pickup.',          'Enter the deposit amount in the Deposit Amount field when creating the booking or processing pickup.'],
    ['Held',      'Rental is active or returned.',                        'No action required. Deposit status shows as Held on the rental detail.'],
    ['Forfeited', 'Deposit retained due to damage or unpaid balance.',    'Click Forfeit Deposit on the rental detail. The deposit is applied against the outstanding balance.'],
    ['Refunded',  'Rental is complete with no issues; deposit returned.', 'Click Refund Deposit and record the refund method and reference.'],
  ], 18, 26, 56),
  spacer(80),
  note('Forfeiting and refunding a deposit are both irreversible. These options appear only after the rental has been returned. Confirm the action with the customer before proceeding.'),
  spacer(120),

  /* 4.14 */
  h2('4.14   Settling Damage & Repair Costs'),
  spacer(80),
  body('When new damage is found at return, the system uses a two-step process: record an estimated repair cost first, then settle the actual cost once the repair is complete. The damage settlement is recorded as a separate transaction from the rental balance.'),
  spacer(60),

  h3('Step 1 — Record Estimated Repair Cost'),
  navPath('Rental Detail  >  Damage & Repairs tab  >  Record Repair Cost'),
  spacer(40),
  step(1, 'Open the rental (must be in Returned or later status) and go to the Damage & Repairs tab.'),
  step(2, 'Click Record Repair Cost.'),
  step(3, 'Enter the Estimated Repair Cost — your best estimate of the repair bill.'),
  step(4, 'Click Save. A pending repair cost transaction is recorded in the payment history.'),
  spacer(80),

  h3('Step 2 — Settle Damage'),
  navPath('Rental Detail  >  Damage & Repairs tab  >  Settle Damage'),
  spacer(40),
  step(1, 'Once the actual repair cost is known, click Settle Damage.'),
  step(2, 'Choose a settlement method:'),
  spacer(20),
  table2([
    ['Settlement Method',  'When to Use'],
    ['Collect from Customer', 'Customer pays directly. Enter the actual repair amount, payment method, and reference.'],
    ['Forfeit Deposit',       'Apply the held security deposit against the repair cost. No additional payment required from the customer.'],
  ]),
  spacer(40),
  step(3, 'If collecting from the customer, enter the Actual Repair Cost, Payment Method, and Payment Reference.'),
  step(4, 'Click Confirm Settlement. The damage is marked settled and the pending repair cost transaction is updated.'),
  spacer(80),

  h3('Online Damage Payment Link'),
  body('If the customer is not present, send them a payment link specifically for the damage amount:'),
  spacer(40),
  navPath('Rental Detail  >  Damage & Repairs tab  >  Send Damage Payment Link'),
  spacer(40),
  body('This generates a secure payment page showing only the damage amount. When the customer pays online, the damage is automatically settled and recorded. The damage payment does not affect any outstanding rental balance — it is a separate transaction.'),
  spacer(80),
  note('Always record an estimated repair cost (Step 1) before settling or sending a damage payment link. The estimate creates the transaction record that the settlement updates.'),
  spacer(120),

  /* 4.15 */
  h2('4.15   Sending a Payment Link'),
  spacer(80),
  body('Use Send Payment Link to generate a secure, customer-facing payment page for any outstanding rental balance. The customer pays via the online gateway without needing to log in.'),
  spacer(60),
  navPath('Rental Detail  >  Send Payment Link button'),
  spacer(60),

  step(1, 'Open the rental and click Send Payment Link.'),
  step(2, 'The system generates a unique, time-limited payment URL and sends it to the customer\'s email.'),
  step(3, 'The customer clicks the link and completes payment via the configured gateway.'),
  step(4, 'Once payment is confirmed, the rental balance and payment history update automatically.'),
  spacer(80),
  note('The customer must have an email address on their profile. If the customer does not receive the link, check their spam folder or resend using the same button.'),
  spacer(120),

  /* 4.16 */
  h2('4.16   Sending an Invoice'),
  spacer(80),
  body('Send an invoice PDF to the customer\'s email at any point during or after the rental. The invoice includes all charges, applied discounts, payments received, and the outstanding balance.'),
  spacer(60),
  navPath('Rental Detail  >  Invoice tab  >  Send to Customer'),
  spacer(60),

  step(1, 'Open the rental and click the Invoice tab.'),
  step(2, 'Review the invoice preview — confirm charges, payments, and balance are correct.'),
  step(3, 'Click Send to Customer. A confirmation dialog appears.'),
  step(4, 'Confirm the send. The invoice PDF is emailed to the customer\'s registered email address.'),
  spacer(80),
  note('Invoices can be sent at any rental stage. The Send to Customer button is hidden when the customer has no email address. Update the customer profile with an email before attempting to send.'),
  spacer(120),

  /* 4.17 */
  h2('4.17   Editing Rental Details'),
  spacer(80),
  body('Core rental details can be edited by Admin users after the rental is created. Managers cannot edit the underlying booking record — only Admins have access to the Edit Details button.'),
  spacer(60),
  navPath('Rental Detail  >  Edit Details button  (Admin only)'),
  spacer(60),

  h3('Editable Fields (Admin Only)'),
  fieldTable([
    ['Pickup Date & Time',  false, 'Date and time pickers — adjustable before pickup has been processed.'],
    ['Return Date & Time',  false, 'Date and time pickers — can be changed at any stage. For active rentals, use Extend Rental (section 4.8) which includes a pricing preview.'],
    ['Booking Source',      false, 'Enum — Walk In, Phone, Online, Referral, Corporate.'],
    ['Pickup Location',     false, 'Dropdown — can be changed before pickup is processed.'],
    ['Dropoff Location',    false, 'Dropdown — can be changed at any stage.'],
    ['Notes',               false, 'Textarea — internal notes. Always editable by Admin.'],
  ]),
  spacer(80),
  note('Vehicle, Customer, and core Pricing fields cannot be edited directly after the rental is created. To change the vehicle use Switch Vehicle (section 4.9). To change pricing use additional charges or discount fields where available.'),
  spacer(200),
  endMarker(4),
];

/* ════════════════════════════════════════════════
   PART 5  —  AIRPORT TRANSFER OPERATIONS
   ════════════════════════════════════════════════ */
const part5 = [
  pb(),
  partHeading('PART 5  —  AIRPORT TRANSFER OPERATIONS'),
  spacer(200),
  body('This part covers Airport Transfer — a separate booking type for point-to-point transfers between an airport and a customer\'s destination. Airport transfers use their own booking flow, pricing packages, and status lifecycle independent of vehicle rentals.'),
  spacer(80),

  /* 5.1 */
  h2('5.1   Airport Transfer Overview'),
  spacer(80),
  body('An airport transfer booking moves a passenger from an airport to a destination (Pickup direction) or from a destination to an airport (Dropoff direction). Each booking is priced against a Package — a named service tier — assigned to a specific airport.'),
  spacer(60),

  h3('Booking Status Flow'),
  table3([
    ['Status',           'Colour', 'Meaning & Next Action'],
    ['Pending',          'Amber',  'Booking created. Awaiting payment or staff confirmation. Action: Record Payment or Confirm Booking.'],
    ['Payment Received', 'Blue',   'Payment recorded. Awaiting staff confirmation. Action: Confirm Booking.'],
    ['Confirmed',        'Green',  'Booking confirmed. Action: Assign Driver & Vehicle.'],
    ['Driver Assigned',  'Teal',   'Driver and/or vehicle assigned. Action: Start Trip when ready.'],
    ['In Progress',      'Purple', 'Trip has started. Action: Complete Trip on arrival.'],
    ['Completed',        'Grey',   'Trip finished. No further actions.'],
    ['Cancelled',        'Dark',   'Booking cancelled. Refund may apply if payment was made.'],
    ['No Show',          'Red',    'Customer did not appear. Marked by staff.'],
  ], 22, 14, 64),
  spacer(80),
  note('Airport transfers use a FleetVehicle (a dedicated pool vehicle assigned to transfers), not a rental vehicle. Ensure fleet vehicles are configured before taking live airport bookings.'),
  spacer(120),

  /* 5.2 */
  h2('5.2   Creating an Airport Transfer Booking (In-Store)'),
  spacer(80),
  body('Use this flow when a customer books in-store, by phone, or when staff creates a booking on behalf of a customer. Website bookings arrive as Pending and follow the same management steps from section 5.3 onwards.'),
  spacer(60),
  navPath('Operations  >  Airport Transfer  >  Bookings  >  New Booking'),
  spacer(60),

  step(1, 'Click New Booking from the Airport Transfer section.'),
  step(2, 'Complete Booking Details — select branch, direction, package, airport terminal, and area.'),
  step(3, 'Set the Scheduled Date and Time for the transfer.'),
  step(4, 'Fill in Passenger Details.'),
  step(5, 'Add Customer details (looked up by email or entered fresh).'),
  step(6, 'Record payment if collected at booking time (optional for in-store; skip for online hold).'),
  step(7, 'Click Save Booking. The booking is created with status Pending.'),
  spacer(80),

  h3('Section 1 — Booking Details'),
  fieldTable([
    ['Branch',             true,  'The branch handling this transfer. Must have Airport Transfer service enabled. Controls available packages and fleet vehicles.'],
    ['Direction',          true,  'Enum — Pickup (airport to destination) or Dropoff (destination to airport). Determines which packages are available and the trip flow.'],
    ['Package',            true,  'Dropdown — the service tier for this transfer (e.g. Economy, Business, Premium). Each package has a base price per airport assignment. Only packages enabled for the selected direction are shown.'],
    ['Airport Terminal',   true,  'Dropdown — the specific airport terminal. Filtered to airports linked to the branch\'s active package assignments.'],
    ['Area Location',      true,  'Dropdown — the pickup or dropoff area (customer\'s side of the transfer). Areas may carry a surcharge displayed next to the name.'],
    ['Scheduled Date',     true,  'Date picker — the date of the transfer. Must be in the future.'],
    ['Scheduled Time',     true,  'Time picker — the scheduled pickup or dropoff time.'],
  ]),
  spacer(60),

  h3('Section 2 — Passenger Details'),
  fieldTable([
    ['Passenger Name',    false, 'Text — name of the primary passenger travelling. Can differ from the customer (account holder).'],
    ['Passenger Phone',   false, 'Text — contact number for the passenger on the day of travel.'],
    ['Passenger Count',   true,  'Numeric — number of passengers. Minimum 1, maximum 4.'],
    ['Flight Number',     false, 'Text — flight identifier (e.g. EK789). Helps the driver monitor arrival or departure.'],
    ['Airline',           false, 'Text — airline name (e.g. Emirates, British Airways).'],
    ['Specific Address',  false, 'Text — detailed pickup or dropoff address within the area, if needed (e.g. unit number, compound name). Maximum 500 characters.'],
    ['Staff Notes',       false, 'Textarea — internal notes for the driver or operations team. Not shown to the customer.'],
  ]),
  spacer(60),

  h3('Section 3 — Customer Details'),
  fieldTable([
    ['Customer Full Name',  true, 'Text — the account holder\'s full name. Used to look up or create the airport customer record.'],
    ['Customer Email',      true, 'Email — used for lookup, notifications, and payment links. If this email exists in the system, the customer record is matched automatically.'],
    ['Customer Phone',      true, 'Text — the account holder\'s phone number.'],
  ]),
  spacer(60),

  h3('Section 4 — Payment (In-Store Only)'),
  fieldTable([
    ['Payment Method',    false, 'Enum — Cash, Mobile Money, Bank Transfer, Offline Transfer. Leave blank if payment will be collected later or via online link.'],
    ['Payment Reference', false, 'Text — transaction reference number from the payment.'],
    ['Coupon Code',       false, 'Text — promotional discount code. Validated in real time.'],
  ]),
  spacer(80),

  h3('Pricing Summary'),
  body('The pricing panel on the right updates as you select a package and area:'),
  spacer(40),
  table2([
    ['Line Item',          'Description'],
    ['Package Rate',       'Base price from the package-airport assignment.'],
    ['Area Surcharge',     'Additional charge if the selected area has a surcharge configured.'],
    ['Coupon Discount',    'Deducted from the subtotal. Percentage or fixed depending on the coupon type.'],
    ['VAT',                'Applied to the discounted subtotal if VAT is enabled in settings.'],
    ['Total Amount',       'Final amount due from the customer.'],
  ]),
  spacer(80),
  note('In-store bookings that record a payment immediately move to Payment Received status rather than Pending. Website bookings always start as Pending and flow through the payment gateway.'),
  spacer(120),

  /* 5.3 */
  h2('5.3   Recording Payment'),
  spacer(80),
  body('For bookings that arrive Pending (typically online bookings where no payment was recorded at creation), staff record payment once the customer pays in-store or via an alternative method.'),
  spacer(60),
  navPath('Airport Transfer  >  Bookings  >  [Booking]  >  Record Payment'),
  spacer(60),

  step(1, 'Open the pending booking and click Record Payment.'),
  step(2, 'Select the Payment Method.'),
  step(3, 'Enter the Payment Reference (optional but recommended).'),
  step(4, 'Click Confirm. The booking status changes to Payment Received.'),
  spacer(80),

  fieldTable([
    ['Payment Method',    true,  'Enum — Cash, Mobile Money, Bank Transfer, Offline Transfer.'],
    ['Payment Reference', false, 'Text — transaction reference number or receipt ID.'],
  ]),
  spacer(80),
  note('To send the customer a secure online payment link instead of collecting in person, use Send Payment Link from the booking detail (see section 5.8). The booking status updates automatically when the customer completes online payment.'),
  spacer(120),

  /* 5.4 */
  h2('5.4   Confirming a Booking'),
  spacer(80),
  body('A booking must be confirmed before a driver and vehicle can be assigned. Confirmation signals to the operations team that the booking is verified and ready for dispatch.'),
  spacer(60),
  navPath('Airport Transfer  >  Bookings  >  [Booking]  >  Confirm Booking'),
  spacer(60),

  step(1, 'Open the booking (status must be Payment Received).'),
  step(2, 'Review all booking details — direction, terminal, area, passenger count, and scheduled time.'),
  step(3, 'Click Confirm Booking. The status changes to Confirmed.'),
  spacer(80),
  note('Confirming a booking triggers a booking confirmation notification to the customer (if notification settings are enabled). Ensure all passenger and flight details are correct before confirming.'),
  spacer(120),

  /* 5.5 */
  h2('5.5   Assigning a Driver & Vehicle'),
  spacer(80),
  body('Once confirmed, assign the driver and fleet vehicle that will handle the transfer. You must assign at least one of driver or vehicle — assigning both is recommended before starting the trip.'),
  spacer(60),
  navPath('Airport Transfer  >  Bookings  >  [Booking]  >  Assign Driver & Vehicle'),
  spacer(60),

  step(1, 'Open the confirmed booking and click Assign Driver & Vehicle.'),
  step(2, 'Select a Driver from the dropdown (optional — at least one of driver or vehicle is required).'),
  step(3, 'Select a Fleet Vehicle from the dropdown (optional — at least one of driver or vehicle is required).'),
  step(4, 'Click Confirm Assignment. The booking status changes to Driver Assigned.'),
  spacer(80),

  fieldTable([
    ['Driver',        false, 'Dropdown — select from available drivers. At least one of Driver or Fleet Vehicle must be chosen.'],
    ['Fleet Vehicle', false, 'Dropdown — select from available fleet vehicles (dedicated transfer vehicles, not rental vehicles). At least one must be chosen.'],
  ]),
  spacer(80),

  h3('Changing or Removing an Assignment'),
  body('If the assigned driver or vehicle needs to change before the trip starts, click Remove Assignment on the booking detail to return the booking to Confirmed status, then re-assign.'),
  spacer(80),
  note('Fleet vehicles are managed separately from rental vehicles (Fleet section in the sidebar). If no fleet vehicles are available, check with your administrator to add vehicles to the fleet pool.'),
  spacer(120),

  /* 5.6 */
  h2('5.6   Managing the Trip'),
  spacer(80),
  body('Once a driver and vehicle are assigned, the trip moves through two remaining state changes — Start Trip and Complete Trip — both performed from the booking detail page.'),
  spacer(60),

  h3('Start Trip'),
  navPath('Airport Transfer  >  Bookings  >  [Booking]  >  Start Trip'),
  spacer(40),
  body('Click Start Trip when the driver departs for the pickup point or the passenger boards. The booking moves to In Progress. The start time is recorded automatically.'),
  spacer(60),

  h3('Complete Trip'),
  navPath('Airport Transfer  >  Bookings  >  [Booking]  >  Complete Trip'),
  spacer(40),
  body('Click Complete Trip when the passenger has been dropped off at their destination. The booking moves to Completed. The completion time is recorded automatically.'),
  spacer(60),

  h3('Mark as No-Show'),
  navPath('Airport Transfer  >  Bookings  >  [Booking]  >  Mark No-Show'),
  spacer(40),
  body('Use this option when the customer does not appear at the scheduled time and cannot be reached. The booking moves to No Show status. This action is available from Confirmed or Driver Assigned status.'),
  spacer(80),
  note('Start Trip requires both a driver and a fleet vehicle to be assigned before it becomes available. If the button is greyed out, check that the assignment step has been completed.'),
  spacer(120),

  /* 5.7 */
  h2('5.7   Cancelling a Booking'),
  spacer(80),
  body('A booking can be cancelled from any non-terminal status (i.e. not already Completed or No Show). Cancelling may trigger a cancellation fee depending on the timing relative to the scheduled departure.'),
  spacer(60),
  navPath('Airport Transfer  >  Bookings  >  [Booking]  >  Cancel Booking'),
  spacer(60),

  step(1, 'Open the booking and click Cancel Booking.'),
  step(2, 'Enter a Reason for cancellation (optional — recommended for record keeping).'),
  step(3, 'Click Confirm Cancellation. The booking status changes to Cancelled.'),
  spacer(60),

  fieldTable([
    ['Reason', false, 'Text — the reason for cancelling this booking. Stored on the booking record and visible to staff.'],
  ]),
  spacer(60),

  h3('Refunding Payment After Cancellation'),
  body('If the customer paid and the booking is cancelled, staff can mark the payment as refunded:'),
  spacer(40),
  navPath('Cancelled Booking Detail  >  Mark as Refunded'),
  spacer(40),
  body('This updates the payment status to Refunded for record-keeping. The actual money transfer to the customer must be handled through your payment provider or bank — the system does not initiate refunds automatically.'),
  spacer(80),
  note('Cancellation fees (if any) are configured per branch and are shown on the booking detail after cancellation. The refund amount shown to the customer accounts for any applicable fee.'),
  spacer(120),

  /* 5.8 */
  h2('5.8   Sending a Payment Link'),
  spacer(80),
  body('For pending bookings where the customer has not yet paid, send a secure online payment link to their email. This is particularly useful for online bookings awaiting payment confirmation.'),
  spacer(60),
  navPath('Airport Transfer  >  Bookings  >  [Booking]  >  Send Payment Link'),
  spacer(60),

  step(1, 'Open the pending booking and click Send Payment Link.'),
  step(2, 'The system sends a secure payment URL to the customer\'s registered email.'),
  step(3, 'The customer clicks the link and pays via the configured payment gateway.'),
  step(4, 'Once payment is confirmed, the booking status updates to Payment Received automatically and the payment is recorded in the transaction history.'),
  spacer(80),
  note('The Send Payment Link button is only available when the booking payment status is Pending. Once payment is recorded, the button disappears.'),
  spacer(120),

  /* 5.9 */
  h2('5.9   Airport Packages & Pricing (Admin Setup)'),
  spacer(80),
  body('Packages define the service tiers available for airport transfers. Each package is then assigned to one or more airports with a specific base price. This setup is done by the Admin and is a prerequisite for taking airport bookings.'),
  spacer(60),

  h3('Step 1 — Create a Package'),
  navPath('Settings  >  Airport Transfer  >  Packages  >  Add Package'),
  spacer(40),
  fieldTable([
    ['Name',                      true,  'Text — package display name shown to customers and staff (e.g. Economy Transfer, Business Class, Premium).'],
    ['Description',               false, 'Text — short description of what is included in this package tier.'],
    ['Features',                  true,  'List — service features included in this package (e.g. Meet & Greet, Complimentary Water, Free Waiting Time). Add each feature separately.'],
    ['Available for Pickup',      true,  'Toggle — whether this package can be used for airport-to-destination (Pickup) bookings.'],
    ['Available for Dropoff',     true,  'Toggle — whether this package can be used for destination-to-airport (Dropoff) bookings.'],
    ['Auto Assign Vehicle',       true,  'Toggle — when on, the system automatically assigns an available fleet vehicle to new bookings using this package.'],
    ['Active',                    true,  'Toggle — inactive packages do not appear in the booking form dropdown.'],
  ]),
  spacer(60),

  h3('Step 2 — Assign Package to an Airport'),
  navPath('Settings  >  Airport Transfer  >  Package Assignments  >  Assign Package'),
  spacer(40),
  body('Each package must be assigned to a specific airport with a base price before it can be used in bookings. The same package can be assigned to multiple airports at different prices.'),
  spacer(40),
  fieldTable([
    ['Package',     true, 'Dropdown — select the package to assign.'],
    ['Airport',     true, 'Dropdown — select the airport this pricing applies to. A package can only be assigned once per airport.'],
    ['Base Price',  true, 'Numeric — the base fare for this package at this airport. Area surcharges are added on top of this price at booking time.'],
    ['Active',      true, 'Toggle — only active assignments appear in the booking form.'],
  ]),
  spacer(80),
  note('Area surcharges are configured separately in Settings > Airport Transfer > Locations. Assign the area location to a branch and set the surcharge amount there.'),
  spacer(200),
  endMarker(5),
];

/* ════════════════════════════════════════════════
   PART 6  —  CHAUFFEUR RENTAL OPERATIONS
   ════════════════════════════════════════════════ */
const part6 = [
  pb(),
  partHeading('PART 6  —  CHAUFFEUR RENTAL OPERATIONS'),
  spacer(200),
  body('This part covers chauffeur rental bookings — a service where the customer books a vehicle with a driver for a set period. Unlike airport transfers, chauffeur bookings do not follow a fixed route; the customer uses the vehicle and driver as needed during the booking window. This part covers creating bookings, managing their lifecycle, logging pickup and return, and handling payments.'),
  spacer(80),

  /* 6.1 */
  h2('6.1   Chauffeur Booking Status Workflow'),
  spacer(80),
  body('Chauffeur bookings move through seven statuses. The workflow is simpler than rentals — there is no separate Confirmed/Active split, and pricing is set at booking time from the vehicle\'s chauffeur service rate.'),
  spacer(60),
  table3([
    ['Status', 'Colour', 'Meaning & Required Action'],
    ['Pending',         'Amber',  'Booking created — not yet confirmed. Review and confirm to proceed.'],
    ['Confirmed',       'Blue',   'Booking confirmed. Assign a driver and vehicle before the pickup time.'],
    ['Driver Assigned', 'Purple', 'Driver and/or vehicle assigned. Ready for the pickup time.'],
    ['In Progress',     'Green',  'Trip has started. Driver is with the customer.'],
    ['Completed',       'Teal',   'Booking finished successfully.'],
    ['Cancelled',       'Grey',   'Booking cancelled. A cancellation fee may apply.'],
    ['No Show',         'Red',    'Customer did not appear at the pickup location and time.'],
  ], 22, 14, 64),
  spacer(80),
  note('Online bookings from the public website start at Pending. In-store bookings can be created already Confirmed if no additional review is needed.'),
  spacer(120),

  /* 6.2 */
  h2('6.2   Creating a Chauffeur Booking (In-Store)'),
  spacer(80),
  body('Use this form to create a chauffeur booking at the counter or over the phone. Select the vehicle first — the system calculates the booking cost from the vehicle\'s configured chauffeur service rate and the scheduled duration.'),
  spacer(60),
  navPath('Operations  >  Chauffeur Rental  >  Bookings  >  New Booking'),
  spacer(60),

  step(1, 'Go to Operations > Chauffeur Rental > Bookings > New Booking.'),
  step(2, 'Select the Branch and then the Vehicle (searchable by make, model, or plate).'),
  step(3, 'Select the Pickup Location if the customer needs to be collected from a specific point.'),
  step(4, 'Set the Pickup Date and Pickup Time. The system validates against the branch\'s booking window settings.'),
  step(5, 'Enter the Customer\'s full name and phone number. Email is optional but needed to send a payment link or booking confirmation.'),
  step(6, 'Fill in the Expected Destination if known (helps with planning).'),
  step(7, 'If collecting payment at booking, select the Payment Method and enter a reference if applicable.'),
  step(8, 'Add any Staff Notes for internal use.'),
  step(9, 'Click Create Booking.'),
  spacer(80),

  h4('Booking Form Fields'),
  fieldTable([
    ['Branch',               true,  'Dropdown — the branch handling this booking. Determines available vehicles and drivers.'],
    ['Vehicle',              true,  'Searchable dropdown — select a fleet vehicle available for chauffeur service. Shows make, model, and registration plate.'],
    ['Pickup Location',      false, 'Dropdown — a configured chauffeur pickup location. A location surcharge may apply. Leave blank if the customer provides their own address.'],
    ['Pickup Date',          true,  'Date picker — the date of the booking. Dates with existing confirmed bookings for the selected vehicle are blocked.'],
    ['Pickup Time',          true,  'Time picker — the scheduled pickup time. Must fall within the branch\'s chauffeur booking window (configured in settings).'],
    ['Return Time',          false, 'Time picker — the scheduled return time. Defaults to the standard return time from settings if left blank. Overtime charges apply if the booking runs beyond this time.'],
    ['Customer Full Name',   true,  'Text — customer\'s full name.'],
    ['Customer Phone',       true,  'Text — customer\'s contact phone number.'],
    ['Customer Email',       false, 'Email — needed to send a payment link, booking confirmation, or invoice to the customer.'],
    ['Expected Destination', false, 'Text — where the customer intends to go. Used for driver planning only; not binding.'],
    ['Payment Method',       false, 'Dropdown — Cash, Mobile Money, Bank Transfer, or Offline Transfer. Leave blank if no payment is collected at booking.'],
    ['Payment Reference',    false, 'Text — transaction or receipt reference for the payment collected.'],
    ['Staff Notes',          false, 'Textarea — internal notes not shown to the customer (max 2,000 characters).'],
  ]),
  spacer(80),

  h3('Pricing'),
  body('Pricing is calculated automatically from the vehicle\'s chauffeur service rate assignment. The total is determined at booking time and stored as snapshots — changes to the vehicle\'s rate after booking do not affect existing bookings.'),
  spacer(60),
  table2([
    ['Component', 'How It Is Calculated'],
    ['Base Price',       'From the vehicle\'s chauffeur service rate for the booking duration.'],
    ['Pickup Charge',    'Surcharge from the selected pickup location, if the location has a charge configured.'],
    ['VAT',             'Applied to the subtotal at the branch VAT rate, when VAT is enabled in settings.'],
    ['Overtime Charge',  'Applied if the booking runs beyond the Return Time — calculated per hour at the vehicle\'s overtime rate.'],
    ['Total',           'Base Price + Pickup Charge + VAT + Overtime Charge.'],
  ]),
  spacer(120),

  /* 6.3 */
  h2('6.3   Viewing the Bookings List'),
  spacer(80),
  body('All chauffeur bookings for your branch are listed in Operations > Chauffeur Rental > Bookings. Use the status filter, date filter, and search to locate specific bookings quickly.'),
  spacer(60),
  navPath('Operations  >  Chauffeur Rental  >  Bookings'),
  spacer(60),
  table2([
    ['Column', 'Description'],
    ['Reference',   'Unique booking reference. Click to open the booking detail.'],
    ['Customer',    'Customer name and phone number.'],
    ['Vehicle',     'Assigned fleet vehicle (make, model, plate).'],
    ['Pickup Time', 'Scheduled pickup date and time.'],
    ['Driver',      'Assigned driver name, or "Unassigned" if not yet assigned.'],
    ['Status',      'Current booking status, colour-coded.'],
    ['Payment',     'Payment status — Pending, Paid, Refunded, or Waived.'],
  ]),
  spacer(120),

  /* 6.4 */
  h2('6.4   Confirming a Booking'),
  spacer(80),
  body('After creation, a booking sits in Pending status. Confirming it signals that the booking is accepted and enables driver assignment.'),
  spacer(60),
  navPath('Booking Detail  >  Confirm button  (visible when status is Pending)'),
  spacer(60),

  step(1, 'Open the booking from the list.'),
  step(2, 'Review the booking details — vehicle, customer, pickup time, and pricing.'),
  step(3, 'Click Confirm and confirm the action. The status changes to Confirmed.'),
  spacer(120),

  /* 6.5 */
  h2('6.5   Assigning a Driver & Vehicle'),
  spacer(80),
  body('Once confirmed, assign a driver and/or vehicle to the booking. The driver receives a booking document by email when assigned (if driver document notifications are enabled in settings).'),
  spacer(60),
  navPath('Booking Detail  >  Assign Driver button  (visible when status is Confirmed)'),
  spacer(60),
  fieldTable([
    ['Driver',  false, 'Dropdown — select an available driver. Either a driver or vehicle (or both) is required.'],
    ['Vehicle', false, 'Dropdown — select an available fleet vehicle. Can be reassigned if the vehicle changes.'],
  ]),
  spacer(80),

  step(1, 'Click Assign Driver (or Change Driver if already assigned).'),
  step(2, 'Select the driver and/or vehicle.'),
  step(3, 'Click Confirm. The booking status advances to Driver Assigned.'),
  spacer(80),
  note('To change the driver after assignment, click Change Driver. To unassign entirely, click Remove Driver — the booking reverts to Confirmed status.'),
  spacer(120),

  /* 6.6 */
  h2('6.6   Starting the Trip & Logging Pickup'),
  spacer(80),
  body('When the driver meets the customer and the trip begins, click Start Trip to move the booking to In Progress. Optionally log the pickup details — location, odometer reading, and whether the customer was present — for the audit trail.'),
  spacer(60),
  navPath('Booking Detail  >  Start Trip button  (visible when status is Confirmed or Driver Assigned)'),
  spacer(60),

  step(1, 'Click Start Trip and confirm the action. The status changes to In Progress.'),
  step(2, 'Optionally click Log Pickup to record pickup details.'),
  spacer(60),

  h4('Pickup Log Fields'),
  fieldTable([
    ['Pickup Location',  false, 'Text — the actual address where the customer was collected (may differ from the booking location).'],
    ['Odometer Reading', false, 'Number — odometer reading at pickup in km.'],
    ['Customer Present', false, 'Toggle — whether the customer was physically present at pickup.'],
    ['Driver Notes',     false, 'Textarea — any notes from the driver about the pickup (traffic, delays, special instructions).'],
  ]),
  spacer(120),

  /* 6.7 */
  h2('6.7   Completing the Trip & Logging Return'),
  spacer(80),
  body('When the customer\'s booking period ends and the vehicle is returned, click Complete Trip to close the booking. Log the return details to record the vehicle\'s condition and mileage at return.'),
  spacer(60),
  navPath('Booking Detail  >  Complete Trip button  (visible when status is In Progress)'),
  spacer(60),

  step(1, 'Click Complete Trip and confirm. The status changes to Completed.'),
  step(2, 'Optionally click Log Return to record return details.'),
  spacer(60),

  h4('Return Log Fields'),
  fieldTable([
    ['Odometer Reading', false, 'Number — odometer reading at return in km. The system calculates total kilometres driven.'],
    ['Condition Notes',  false, 'Textarea — describe the vehicle\'s condition on return. Note any damage, cleaning issues, or fuel level.'],
  ]),
  spacer(80),
  note('If the booking runs past the scheduled Return Time, overtime hours and charges are recorded automatically based on the vehicle\'s overtime rate.'),
  spacer(120),

  /* 6.8 */
  h2('6.8   Recording Payment'),
  spacer(80),
  body('If payment was not collected at booking, record it on the booking detail page once payment is received.'),
  spacer(60),
  navPath('Booking Detail  >  Record Payment button  (visible when payment status is Pending)'),
  spacer(60),
  fieldTable([
    ['Payment Method',    true,  'Dropdown — Cash, Mobile Money, Bank Transfer, or Offline Transfer.'],
    ['Payment Reference', false, 'Text — transaction or receipt reference.'],
    ['Payment Phone',     false, 'Text — mobile money number used for the payment (for Mobile Money transactions).'],
  ]),
  spacer(80),
  body('After recording payment, the payment status changes to Paid.'),
  spacer(120),

  /* 6.9 */
  h2('6.9   Sending a Payment Link'),
  spacer(80),
  body('For customers paying remotely, send a secure online payment link to their email. The customer pays via the configured payment gateway without needing to log in.'),
  spacer(60),
  navPath('Booking Detail  >  Send Payment Link button  (visible when payment is Pending and customer has a registered email)'),
  spacer(60),

  step(1, 'Open the booking detail.'),
  step(2, 'Click Send Payment Link.'),
  step(3, 'The system generates a secure link and emails it to the customer.'),
  step(4, 'The booking\'s payment status updates automatically once the customer completes payment.'),
  spacer(80),
  note('The Send Payment Link button is only visible when the customer has an email address on file. Payment links use the same secure token mechanism as rental payment links.'),
  spacer(120),

  /* 6.10 */
  h2('6.10  Marking a No-Show'),
  spacer(80),
  body('If the customer does not appear at the agreed location and time, mark the booking as No-Show. A no-show fee may be applied automatically based on branch settings.'),
  spacer(60),
  navPath('Booking Detail  >  No Show button  (visible when status is Confirmed or Driver Assigned)'),
  spacer(60),

  step(1, 'Click No Show and confirm the action.'),
  step(2, 'The booking status changes to No Show. Any configured no-show fee is applied to the booking summary.'),
  spacer(80),
  note('If the booking was paid and a no-show fee applies, the difference between the amount paid and the no-show fee may need to be refunded. Use the Refund action if applicable.'),
  spacer(120),

  /* 6.11 */
  h2('6.11  Cancelling a Booking & Processing Refunds'),
  spacer(80),
  body('A booking can be cancelled at any stage before it reaches Completed or No Show. A cancellation fee may be applied depending on how close the cancellation is to the pickup time.'),
  spacer(60),
  navPath('Booking Detail  >  Cancel button'),
  spacer(60),
  fieldTable([
    ['Notes', false, 'Textarea — brief reason for the cancellation (stored for audit purposes, max 1,000 characters).'],
  ]),
  spacer(80),

  step(1, 'Click Cancel on the booking detail page.'),
  step(2, 'Enter a cancellation reason if required.'),
  step(3, 'Click Confirm. The status changes to Cancelled. Any cancellation fee is shown in the booking summary.'),
  spacer(80),

  h3('Processing a Refund'),
  body('If the booking was paid before cancellation, a Refund option appears on the detail page. Two outcomes are available:'),
  spacer(60),
  table2([
    ['Refund Action', 'What It Does'],
    ['Approve Refund', 'Records that a refund was issued to the customer (minus any cancellation fee). The payment status changes to Refunded. Enter an optional note explaining the refund.'],
    ['Waive Refund',   'Records that no refund was issued (e.g., customer forfeited payment). The payment status changes to Waived. Enter an optional note.'],
  ]),
  spacer(80),
  note('Refunds recorded in the system are for tracking purposes only — the actual money transfer must be done outside the system (bank transfer, mobile money, etc.). Always record a note explaining the refund decision for the audit trail.'),
  spacer(120),

  /* 6.12 */
  h2('6.12  Sending the Booking Document to the Driver'),
  spacer(80),
  body('A booking document (PDF) containing the booking details, customer information, and pickup location can be sent directly to the assigned driver by email. This is triggered automatically when a driver is assigned, if driver document notifications are enabled in Settings. It can also be triggered manually.'),
  spacer(60),
  navPath('Booking Detail  >  Send Booking Document button'),
  spacer(60),

  step(1, 'Ensure a driver with an email address is assigned to the booking.'),
  step(2, 'Click Send Booking Document.'),
  step(3, 'The system generates a PDF with all relevant booking details and emails it to the driver.'),
  spacer(80),
  note('The booking document is sent to the driver\'s email — not the customer\'s. The customer receives a separate booking confirmation email. Driver document emails are controlled by the Chauffeur Booking notification toggle in Settings > Notifications.'),
  spacer(120),

  /* 6.13 */
  h2('6.13  Chauffeur Locations — Admin'),
  spacer(80),
  body('Chauffeur locations are configured pickup points with optional surcharges. When a customer selects a pickup location during booking, the surcharge is added to the booking total. Location management is restricted to Admin roles.'),
  spacer(60),
  navPath('Settings  >  Chauffeur Rental  >  Locations'),
  spacer(60),

  h3('Creating a Location'),
  fieldTable([
    ['Branch',    true,  'Dropdown — the branch this location belongs to.'],
    ['Name',      true,  'Text — location name displayed in the booking form (e.g., "Kotoka International Airport", "Accra Mall").'],
    ['Charge',    false, 'Number — surcharge applied to bookings using this location. Enter 0 or leave blank for no surcharge.'],
    ['Is Active', true,  'Toggle — inactive locations are hidden from the booking form.'],
  ]),
  spacer(200),
  endMarker(6),
];

/* ════════════════════════════════════════════════
   PART 7  —  FLEET & VEHICLE MANAGEMENT
   ════════════════════════════════════════════════ */
const part7 = [
  pb(),
  partHeading('PART 7  —  FLEET & VEHICLE MANAGEMENT'),
  spacer(200),
  body('This part covers the two types of vehicles in the system and how to manage them: Rental Vehicles (used for standard car rentals) and Fleet Vehicles (used for chauffeur bookings and airport transfers). It also covers driver management, expense recording, and document expiry tracking.'),
  spacer(80),

  /* 7.1 */
  h2('7.1   Two Vehicle Types — Overview'),
  spacer(80),
  body('The system maintains two separate vehicle registries with different purposes:'),
  spacer(60),
  table3([
    ['Type', 'Used For', 'Where to Manage'],
    ['Rental Vehicle', 'Standard car rentals (Part 4). The customer drives the vehicle themselves.', 'Operations > Vehicles'],
    ['Fleet Vehicle',  'Chauffeur rentals (Part 6) and airport transfers (Part 5). A driver operates the vehicle.', 'Operations > Fleet'],
  ], 22, 30, 48),
  spacer(80),
  note('A vehicle cannot be both a Rental Vehicle and a Fleet Vehicle simultaneously. If a physical vehicle is used for multiple service types, it must be registered separately in each registry.'),
  spacer(120),

  /* 7.2 */
  h2('7.2   Adding a Rental Vehicle'),
  spacer(80),
  body('Rental vehicles are the cars, SUVs, or vans that customers drive themselves. Each vehicle belongs to a branch and a category, and has its own daily rental rate.'),
  spacer(60),
  navPath('Operations  >  Vehicles  >  Add Vehicle'),
  spacer(60),

  step(1, 'Go to Operations > Vehicles > Add Vehicle.'),
  step(2, 'Fill in the Vehicle Identity fields: Name, Make, Model, Year, Colour, Licence Plate, and optionally VIN.'),
  step(3, 'Select the Branch and Category the vehicle belongs to.'),
  step(4, 'Set the Fuel Type and Transmission.'),
  step(5, 'Enter capacity and rate information: Seats, Daily Rate, and optionally Security Deposit.'),
  step(6, 'Enter the Insurance Expiry Date and Roadworthy Expiry Date.'),
  step(7, 'Add Features (GPS, Air Conditioning, Bluetooth, etc.) using the feature tags field.'),
  step(8, 'Upload vehicle photos. The first uploaded image becomes the primary display photo.'),
  step(9, 'Click Save Vehicle.'),
  spacer(80),

  h4('Vehicle Identity'),
  fieldTable([
    ['Name',          true,  'Text — display name for the vehicle (e.g., "Toyota Corolla 2022"). Shown in booking forms and customer-facing pages.'],
    ['Make',          true,  'Text — vehicle manufacturer (e.g., "Toyota", "Honda").'],
    ['Model',         true,  'Text — vehicle model (e.g., "Corolla", "Civic").'],
    ['Year',          true,  'Number — year of manufacture (1900 to current year + 1).'],
    ['Colour',        true,  'Text — vehicle colour.'],
    ['Licence Plate', true,  'Text — registration plate number. Must be unique across the entire system.'],
    ['VIN',           false, 'Text — 17-character Vehicle Identification Number. Must be unique if provided.'],
    ['Branch',        false, 'Dropdown — the branch this vehicle belongs to. Vehicles without a branch are globally available.'],
    ['Category',      true,  'Dropdown — the vehicle category (Economy, SUV, Premium, etc.). Categories are configured by Admin.'],
  ]),
  spacer(80),

  h4('Specifications'),
  fieldTable([
    ['Fuel Type',     true,  'Dropdown — Petrol, Diesel, Hybrid, or Electric.'],
    ['Transmission',  true,  'Dropdown — Automatic or Manual.'],
    ['Seats',         true,  'Number — total passenger capacity (1–50).'],
    ['Engine Size',   false, 'Text — engine displacement (e.g., "1.8L", "2.0 Turbo").'],
    ['Odometer',      false, 'Number — current odometer reading in km. Used as a baseline for mileage tracking.'],
  ]),
  spacer(80),

  h4('Pricing & Documents'),
  fieldTable([
    ['Daily Rate',               true,  'Number — rental rate per day in the branch currency.'],
    ['Security Deposit',         false, 'Number — deposit amount collected at rental. Leave at 0 if no deposit is required.'],
    ['Insurance Expiry Date',    true,  'Date picker — expiry date of the vehicle\'s insurance policy. Required for expiry tracking and alerts.'],
    ['Roadworthy Expiry Date',   true,  'Date picker — expiry date of the roadworthy certificate. Required for expiry tracking and alerts.'],
    ['Has Insurance',            false, 'Toggle — marks the vehicle as insured. Set automatically when Insurance Expiry Date is entered.'],
    ['Has Roadworthy',           false, 'Toggle — marks the vehicle as having a valid roadworthy certificate.'],
  ]),
  spacer(80),

  h4('Other Fields'),
  fieldTable([
    ['Features',         false, 'Tag input — list of vehicle features (e.g., GPS, Air Conditioning, Bluetooth, Sunroof). Shown on the public vehicle listing.'],
    ['Description',      false, 'Textarea — marketing description shown to customers on the vehicle detail page.'],
    ['Condition Notes',  false, 'Textarea — internal notes about the vehicle\'s current condition. Not shown to customers.'],
    ['Price Visible',    false, 'Toggle — when disabled, the vehicle\'s daily rate is hidden on the public website.'],
    ['Featured',         false, 'Toggle — featured vehicles are highlighted in the public vehicle listings.'],
  ]),
  spacer(120),

  /* 7.3 */
  h2('7.3   Adding a Fleet Vehicle'),
  spacer(80),
  body('Fleet vehicles are operated by drivers for chauffeur and airport transfer bookings. They require fewer pricing fields than rental vehicles, but must be linked to a branch and optionally configured with chauffeur service rates and airport package assignments.'),
  spacer(60),
  navPath('Operations  >  Fleet  >  Add Fleet Vehicle'),
  spacer(60),

  step(1, 'Go to Operations > Fleet > Add Fleet Vehicle.'),
  step(2, 'Fill in Make, Model, Year, Colour, and Licence Plate.'),
  step(3, 'Select the Branch.'),
  step(4, 'Enter Seats and optionally Engine, Transmission, and Fuel Type.'),
  step(5, 'Enter Insurance Expiry Date and Roadworthy Expiry Date.'),
  step(6, 'If this is a personal vehicle (owned by a driver), toggle Is Personal Vehicle and select the Default Driver.'),
  step(7, 'Add Features and upload photos.'),
  step(8, 'Click Save. Then configure chauffeur service and airport package assignments from the vehicle detail page.'),
  spacer(80),

  h4('Fleet Vehicle Fields'),
  fieldTable([
    ['Branch',                true,  'Dropdown — the branch this fleet vehicle belongs to.'],
    ['Make',                  true,  'Text — vehicle manufacturer.'],
    ['Model',                 true,  'Text — vehicle model.'],
    ['Year',                  true,  'Number — year of manufacture.'],
    ['Colour',                true,  'Text — vehicle colour.'],
    ['Licence Plate',         true,  'Text — unique registration plate number.'],
    ['Seats',                 true,  'Number — passenger capacity (1–50).'],
    ['Fuel Type',             false, 'Dropdown — Petrol, Diesel, Hybrid, or Electric.'],
    ['Transmission',          false, 'Dropdown — Automatic, Manual, or Semi-Automatic.'],
    ['Engine',                false, 'Text — engine specification.'],
    ['Insurance Expiry Date', false, 'Date picker — insurance certificate expiry. Triggers expiry alerts when within 30 days.'],
    ['Roadworthy Expiry Date',false, 'Date picker — roadworthy certificate expiry. Triggers expiry alerts when within 30 days.'],
    ['Has Insurance',         true,  'Toggle — marks the vehicle as currently insured.'],
    ['Has Roadworthy',        true,  'Toggle — marks the vehicle as having a valid roadworthy certificate.'],
    ['Is Personal Vehicle',   false, 'Toggle — indicates the vehicle is owned by a driver. When enabled, a Default Driver must be selected.'],
    ['Default Driver',        false, 'Dropdown — the driver associated with this vehicle. Required when Is Personal Vehicle is enabled.'],
    ['Features',              false, 'Tag input — list of vehicle features.'],
    ['Description',           false, 'Textarea — vehicle description.'],
    ['Notes',                 false, 'Textarea — internal staff notes about the vehicle.'],
  ]),
  spacer(120),

  /* 7.4 */
  h2('7.4   Vehicle Status Management'),
  spacer(80),
  body('Both rental vehicles and fleet vehicles have a status field that controls their availability. Update the status whenever a vehicle\'s operational state changes.'),
  spacer(80),

  h3('Rental Vehicle Statuses'),
  table3([
    ['Status', 'Colour', 'Meaning'],
    ['Available',         'Green',  'Ready to be booked. Appears in the booking form vehicle list.'],
    ['Rented',            'Blue',   'Currently out on a rental. Set automatically when a rental is Active.'],
    ['Maintenance',       'Amber',  'Undergoing repairs or servicing. Not available for new bookings.'],
    ['Unavailable',       'Grey',   'Temporarily taken out of service for any reason other than maintenance.'],
    ['Pending Approval',  'Purple', 'Newly added vehicle awaiting admin activation.'],
    ['Retired',           'Red',    'Permanently removed from service. Cannot be booked.'],
  ], 20, 14, 66),
  spacer(80),

  h3('Fleet Vehicle Statuses'),
  table3([
    ['Status', 'Colour', 'Meaning'],
    ['Available',    'Green', 'Ready to be assigned to bookings.'],
    ['On Trip',      'Blue',  'Currently on an active airport transfer or chauffeur booking.'],
    ['Maintenance',  'Amber', 'Undergoing maintenance. Not assignable.'],
    ['Inactive',     'Grey',  'Temporarily taken out of service.'],
    ['Retired',      'Red',   'Permanently removed from service.'],
  ], 20, 14, 66),
  spacer(80),
  navPath('Vehicle or Fleet Vehicle Detail  >  Status dropdown  >  Select new status'),
  spacer(120),

  /* 7.5 */
  h2('7.5   Insurance & Roadworthy Expiry Tracking'),
  spacer(80),
  body('The system monitors insurance and roadworthy certificate expiry dates for all vehicles. Automated daily checks alert staff to vehicles with documents expiring within 30 days or already expired. Dedicated sidebar views show at-risk vehicles.'),
  spacer(80),

  h3('Expiry Alert States'),
  table3([
    ['State', 'Badge', 'Action Required'],
    ['Valid',          'None / Green', 'No action required — document expires more than 30 days away.'],
    ['Expiring Soon',  'Amber badge',  'Certificate expires within 30 days. Renew and update the expiry date in the system before the current certificate lapses.'],
    ['Expired',        'Red badge',    'Certificate has expired. Vehicle should be taken off the road immediately. Update the expiry date once renewed.'],
  ], 20, 16, 64),
  spacer(80),

  h3('Updating an Expiry Date'),
  step(1, 'Open the vehicle\'s detail page.'),
  step(2, 'Click Edit.'),
  step(3, 'Update the Insurance Expiry Date or Roadworthy Expiry Date field to the new expiry date on the renewed certificate.'),
  step(4, 'Save the changes.'),
  spacer(80),
  note('The sidebar items Operations > Vehicles > Insurance Expiring, Insurance Expired, Roadworthy Expiring, and Roadworthy Expired provide quick-access filtered lists. Check these lists regularly — the automated nightly notification email also lists vehicles in the 30-day window.'),
  spacer(120),

  /* 7.6 */
  h2('7.6   Recording Vehicle Expenses'),
  spacer(80),
  body('Vehicle expenses track costs associated with maintaining and operating rental vehicles — fuel, servicing, repairs, cleaning, insurance payments, and any miscellaneous costs. Expenses are linked to a specific vehicle and can include receipt attachments.'),
  spacer(60),
  navPath('Operations  >  Vehicles  >  [Vehicle]  >  Add Expense'),
  spacer(60),

  step(1, 'Open the vehicle detail page.'),
  step(2, 'Click Add Expense.'),
  step(3, 'Select the Expense Type and enter the Amount.'),
  step(4, 'Set the Expense Date and add a Description.'),
  step(5, 'Optionally attach receipts (up to 3 files).'),
  step(6, 'Click Save.'),
  spacer(80),

  h4('Expense Fields'),
  fieldTable([
    ['Expense Type',  true,  'Dropdown — Fuel, Maintenance, Insurance, Repair, Cleaning, or Other.'],
    ['Amount',        true,  'Number — total cost of the expense in the branch currency.'],
    ['Expense Date',  false, 'Date picker — the date the expense was incurred. Defaults to today if left blank.'],
    ['Description',   false, 'Textarea — details of the expense (e.g., "Full service at ABC Garage", "Fuel top-up 40L").'],
    ['Receipts',      false, 'File upload — up to 3 receipt files. Accepted formats: JPEG, PNG, PDF. Maximum 5 MB per file.'],
  ]),
  spacer(80),
  note('Expense records are used in the Vehicle Expenses report (Part 9). Recording expenses accurately gives management visibility into the true operating cost of each vehicle.'),
  spacer(120),

  /* 7.7 */
  h2('7.7   Adding a Driver'),
  spacer(80),
  body('Drivers are the staff members assigned to chauffeur and airport transfer bookings. Each driver requires a valid driving licence and at least one form of identity document. Driver records are managed separately from staff user accounts.'),
  spacer(60),
  navPath('Operations  >  Fleet  >  Drivers  >  Add Driver'),
  spacer(60),

  step(1, 'Go to Operations > Fleet > Drivers > Add Driver.'),
  step(2, 'Fill in the Personal Information section.'),
  step(3, 'Fill in the Licence Information section — this is required for all drivers.'),
  step(4, 'Optionally complete the Identity Document section.'),
  step(5, 'Set the driver\'s service availability toggles (Chauffeur and/or Airport Transfer).'),
  step(6, 'Upload a driver photo, licence photo, and ID document scan.'),
  step(7, 'Click Save Driver.'),
  spacer(80),

  h4('Personal Information'),
  fieldTable([
    ['First Name',                true,  'Text — driver\'s first name.'],
    ['Last Name',                 true,  'Text — driver\'s last name.'],
    ['Phone Number',              true,  'Text — unique contact number. Used to reach the driver for booking coordination.'],
    ['Email',                     false, 'Email — used to send booking documents. Required if the driver should receive email notifications.'],
    ['Date of Birth',             true,  'Date picker — must be a past date.'],
    ['Address',                   false, 'Textarea — residential address.'],
    ['City',                      false, 'Text — city of residence.'],
    ['Emergency Contact Name',    false, 'Text — name of the driver\'s emergency contact.'],
    ['Emergency Contact Phone',   false, 'Text — emergency contact\'s phone number.'],
    ['Emergency Contact Relation',false, 'Text — relationship to the driver (e.g., "Spouse", "Parent").'],
    ['Notes',                     false, 'Textarea — internal notes about the driver (not visible to the driver).'],
  ]),
  spacer(80),

  h4('Licence Information'),
  fieldTable([
    ['Licence Number',      true,  'Text — unique driving licence number.'],
    ['Licence Class',       true,  'Text — licence classification (e.g., "B", "C", "DE").'],
    ['Licence Expiry Date', true,  'Date picker — must be a future date. Triggers expiry alerts within 30 days.'],
    ['Licence Verified',    false, 'Toggle — mark the licence as physically verified by staff.'],
  ]),
  spacer(80),

  h4('Identity Document'),
  fieldTable([
    ['ID Type',       false, 'Dropdown — Ghana Card, Passport, Voters ID, Driver\'s Licence, SSNIT Card, or Other.'],
    ['ID Number',     false, 'Text — unique document number. Must be unique if provided.'],
    ['ID Expiry Date',false, 'Date picker — identity document expiry date. Triggers expiry alerts if approaching.'],
  ]),
  spacer(80),

  h4('Availability'),
  fieldTable([
    ['Available for Chauffeur',        false, 'Toggle — enables this driver to be assigned to chauffeur rental bookings.'],
    ['Available for Airport Transfer', false, 'Toggle — enables this driver to be assigned to airport transfer bookings.'],
    ['Is Active',                      false, 'Toggle — inactive drivers cannot be assigned to any booking.'],
  ]),
  spacer(120),

  /* 7.8 */
  h2('7.8   Driver Status & Document Expiry Tracking'),
  spacer(80),
  body('Driver availability is controlled by their status field. The system also monitors driving licence and identity document expiry dates and alerts staff through the sidebar and automated daily email notifications.'),
  spacer(80),

  h3('Driver Statuses'),
  table3([
    ['Status', 'Colour', 'Meaning'],
    ['Available',  'Green',  'Driver is free and can be assigned to bookings.'],
    ['On Trip',    'Blue',   'Driver is currently on an active booking.'],
    ['Off Duty',   'Grey',   'Driver is off duty and unavailable for new assignments.'],
    ['Suspended',  'Red',    'Driver is suspended and cannot be assigned to any booking.'],
    ['Inactive',   'Grey',   'Driver account is deactivated.'],
  ], 20, 14, 66),
  spacer(60),
  navPath('Driver Detail  >  Status dropdown  >  Select new status'),
  spacer(80),

  h3('Document Expiry Alerts'),
  body('The same three-state alert system used for vehicle documents applies to driver documents:'),
  spacer(60),
  table2([
    ['Document', 'Alert Trigger'],
    ['Driving Licence',   'Red "Expired" badge when past expiry date. Amber "Expiring Soon" badge within 30 days. Shown on driver detail and in the sidebar Licence Expiring / Licence Expired lists.'],
    ['Identity Document', 'Same alert states as above — shown when an ID type and expiry date are recorded on the driver profile.'],
  ]),
  spacer(80),

  h3('Updating an Expired Licence'),
  step(1, 'Open the driver\'s detail page and click Edit.'),
  step(2, 'Update the Licence Number if it has changed on the new licence.'),
  step(3, 'Update the Licence Expiry Date to the new expiry date.'),
  step(4, 'Save the changes.'),
  step(5, 'Upload the new licence photo using the document upload section on the driver profile.'),
  step(6, 'Toggle Licence Verified once staff have physically verified the renewed licence.'),
  spacer(80),
  note('Drivers with expired licences remain in the system and can still be viewed, but should not be assigned to bookings until the licence is renewed and verified. Consider setting their status to Off Duty until the renewal is complete.'),
  spacer(120),

  /* 7.9 */
  h2('7.9   Assigning Airport Packages to a Fleet Vehicle'),
  spacer(80),
  body('For a fleet vehicle to be used in airport transfer bookings, it must be linked to one or more airport packages. This determines which service tiers the vehicle can fulfil.'),
  spacer(60),
  navPath('Operations  >  Fleet  >  [Fleet Vehicle]  >  Airport Packages tab  >  Assign Package'),
  spacer(60),

  step(1, 'Open the fleet vehicle\'s detail page.'),
  step(2, 'Click the Airport Packages tab.'),
  step(3, 'Click Assign Package.'),
  step(4, 'Select the airport package(s) this vehicle can fulfil.'),
  step(5, 'Save. The vehicle will now appear in the assignment dropdown when a booking uses one of the selected packages.'),
  spacer(80),
  note('A fleet vehicle can be assigned to multiple airport packages. Assign it to all packages that match its capacity and service tier (e.g., an 8-seater might qualify for both Economy and Group Transfer packages).'),
  spacer(120),

  /* 7.10 */
  h2('7.10  Configuring Chauffeur Service on a Fleet Vehicle'),
  spacer(80),
  body('For a fleet vehicle to appear in chauffeur booking forms, it must have a chauffeur service configuration — a vehicle category and base price. This is set from the fleet vehicle detail page.'),
  spacer(60),
  navPath('Operations  >  Fleet  >  [Fleet Vehicle]  >  Chauffeur Service tab  >  Configure'),
  spacer(60),
  fieldTable([
    ['Category',    true, 'Dropdown — the chauffeur vehicle category this vehicle belongs to (e.g., Sedan, SUV, Executive). Categories define the pricing tier and are configured by Admin.'],
    ['Base Price',  true, 'Number — the standard booking rate for this vehicle in the branch currency. This is the rate used to calculate chauffeur booking totals.'],
  ]),
  spacer(80),
  note('Once configured, the fleet vehicle appears in the vehicle dropdown when creating chauffeur bookings for its branch. If the vehicle is deactivated or put into Maintenance status, it will not appear in booking forms until it is restored to Available.'),
  spacer(200),
  endMarker(7),
];

/* ════════════════════════════════════════════════
   HEADERS & FOOTERS
   ════════════════════════════════════════════════ */
function makeHeader(partLabel) {
  return new Header({
    children: [new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: 'Swiftflitz Car Rental  ·  User Manual', font: FONT, bold: true, color: C.navy, size: 18 })] })],
          borders: { ...noBorders(), bottom: { style: BorderStyle.SINGLE, size: 4, color: C.divider } },
          margins: { top: 0, bottom: 60, left: 0, right: 0 },
          width: { size: 65, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: partLabel, font: FONT, color: C.muted, size: 18 })], alignment: AlignmentType.RIGHT })],
          borders: { ...noBorders(), bottom: { style: BorderStyle.SINGLE, size: 4, color: C.divider } },
          margins: { top: 0, bottom: 60, left: 0, right: 0 },
          width: { size: 35, type: WidthType.PERCENTAGE },
        }),
      ]})],
    })],
  });
}

function makeFooter() {
  return new Footer({
    children: [new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '© 2026 Swiftflitz. Confidential.', font: FONT, color: C.muted, size: 16 })] })],
          borders: { ...noBorders(), top: { style: BorderStyle.SINGLE, size: 4, color: C.divider } },
          margins: { top: 60, bottom: 0, left: 0, right: 0 },
          width: { size: 65, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({
            children: [
              new TextRun({ text: 'Page ', font: FONT, color: C.muted, size: 16 }),
              new TextRun({ children: [PageNumber.CURRENT], font: FONT, color: C.navy, size: 16, bold: true }),
              new TextRun({ text: ' of ', font: FONT, color: C.muted, size: 16 }),
              new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, color: C.muted, size: 16 }),
            ],
            alignment: AlignmentType.RIGHT,
          })],
          borders: { ...noBorders(), top: { style: BorderStyle.SINGLE, size: 4, color: C.divider } },
          margins: { top: 60, bottom: 0, left: 0, right: 0 },
          width: { size: 35, type: WidthType.PERCENTAGE },
        }),
      ]})],
    })],
  });
}

/* ════════════════════════════════════════════════
   ASSEMBLE & WRITE
   ════════════════════════════════════════════════ */
const doc = new Document({
  creator: 'Swiftflitz',
  title: 'Swiftflitz Car Rental — User Manual',
  description: 'Administrator and Manager User Manual',
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 22, color: C.text },
        paragraph: { spacing: { after: 100 } },
      },
    },
  },
  sections: [
    /* Section 1: Title page — no header/footer */
    {
      properties: {
        page: { margin: { top: inch(1), bottom: inch(1), left: inch(1.2), right: inch(1.2) } },
      },
      children: titlePageChildren,
    },
    /* Section 2: Part 1 */
    {
      properties: {
        page: { margin: { top: inch(1.1), bottom: inch(1), left: inch(1.2), right: inch(1.2) } },
      },
      headers: { default: makeHeader('Part 1  —  Orientation') },
      footers: { default: makeFooter() },
      children: part1,
    },
    /* Section 3: Part 2 */
    {
      properties: {
        page: { margin: { top: inch(1.1), bottom: inch(1), left: inch(1.2), right: inch(1.2) } },
      },
      headers: { default: makeHeader('Part 2  —  Initial Setup') },
      footers: { default: makeFooter() },
      children: part2,
    },
    /* Section 4: Part 3 */
    {
      properties: {
        page: { margin: { top: inch(1.1), bottom: inch(1), left: inch(1.2), right: inch(1.2) } },
      },
      headers: { default: makeHeader('Part 3  —  Customer Management') },
      footers: { default: makeFooter() },
      children: part3,
    },
    /* Section 5: Part 4 */
    {
      properties: {
        page: { margin: { top: inch(1.1), bottom: inch(1), left: inch(1.2), right: inch(1.2) } },
      },
      headers: { default: makeHeader('Part 4  —  Rental Operations') },
      footers: { default: makeFooter() },
      children: part4,
    },
    /* Section 6: Part 5 */
    {
      properties: {
        page: { margin: { top: inch(1.1), bottom: inch(1), left: inch(1.2), right: inch(1.2) } },
      },
      headers: { default: makeHeader('Part 5  —  Airport Transfer Operations') },
      footers: { default: makeFooter() },
      children: part5,
    },
    /* Section 7: Part 6 */
    {
      properties: {
        page: { margin: { top: inch(1.1), bottom: inch(1), left: inch(1.2), right: inch(1.2) } },
      },
      headers: { default: makeHeader('Part 6  —  Chauffeur Rental Operations') },
      footers: { default: makeFooter() },
      children: part6,
    },
    /* Section 8: Part 7 */
    {
      properties: {
        page: { margin: { top: inch(1.1), bottom: inch(1), left: inch(1.2), right: inch(1.2) } },
      },
      headers: { default: makeHeader('Part 7  —  Fleet & Vehicle Management') },
      footers: { default: makeFooter() },
      children: part7,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync(OUTPUT, buffer);
console.log(`\n✅  Document saved → ${OUTPUT}\n`);
