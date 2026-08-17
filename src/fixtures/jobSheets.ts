export type JobFixture = {
  name: string;
  sheets: string[];
  rows: unknown[][];
  expectedAddress: string;
  expected: Array<{ code: string; description: string; comments: string }>;
};

function sparse(length: number, cells: Record<number, unknown>): unknown[] {
  const row: unknown[] = Array(length).fill(undefined);
  for (const [index, value] of Object.entries(cells)) {
    row[Number(index)] = value;
  }
  return row;
}

export const jobType1: JobFixture = {
  name: "type 1 Code header with comments in column 8",
  sheets: ["Job"],
  rows: [
    sparse(9, { 0: "Address", 2: "12 Test Street" }),
    sparse(9, { 0: "Code", 1: "Description", 8: "Comments" }),
    sparse(9, { 0: "396001", 1: "Gain access", 8: "use spare keys" }),
    sparse(9, { 0: "390915", 1: "Renew deadlock" }),
    sparse(9, { 1: "FORCE ACCESS TO DOOR" }),
  ],
  expectedAddress: "12 Test Street",
  expected: [
    {
      code: "396001",
      description: "Gain access",
      comments: "use spare keys",
    },
    {
      code: "390915",
      description: "Renew deadlock",
      comments: "",
    },
    {
      code: "390915",
      description: "Renew deadlock",
      comments: "FORCE ACCESS TO DOOR",
    },
  ],
};

export const jobType2: JobFixture = {
  name: "type 2 Specification Comments header",
  sheets: ["Job"],
  rows: [
    sparse(8, { 0: "Address", 1: "Flat 1 High Street" }),
    sparse(8, { 0: "Code", 1: "Description", 7: "Specification Comments" }),
    sparse(8, { 0: "372001", 1: "Renew worktop", 7: "check template" }),
  ],
  expectedAddress: "Flat 1 High Street",
  expected: [
    {
      code: "372001",
      description: "Renew worktop",
      comments: "check template",
    },
  ],
};

export const jobType3: JobFixture = {
  name: "type 3 SoR Code header",
  sheets: ["Job"],
  rows: [
    sparse(12, { 1: "Void Address: 8 Park Lane" }),
    sparse(12, { 0: "SoR Code", 1: "Description" }),
    sparse(12, {
      0: "451163",
      1: "Strip wallpaper",
      11: "communal only",
    }),
  ],
  expectedAddress: " 8 Park Lane",
  expected: [
    {
      code: "451163",
      description: "Strip wallpaper",
      comments: "communal only",
    },
  ],
};

export const jobType4: JobFixture = {
  name: "type 4 Auto Pop SPEC Job Code column",
  sheets: ["Cover", "Notes", "Auto Pop SPEC"],
  rows: [
    sparse(10, { 2: "ADDRESS: 22 Green Close" }),
    sparse(10, { 2: "Job Code", 4: "Description" }),
    sparse(10, { 2: "330013", 4: "Renew fire door", 9: "FD30" }),
    sparse(10, { 2: "373007", 4: "Renew base unit door", 9: "check colour" }),
  ],
  expectedAddress: " 22 Green Close",
  expected: [
    {
      code: "330013",
      description: "Renew fire door",
      comments: "FD30",
    },
    {
      code: "373007",
      description: "Renew base unit door",
      comments: "check colour",
    },
  ],
};

export const jobType5: JobFixture = {
  name: "type 5 CODE header",
  sheets: ["Job"],
  rows: [
    sparse(7, { 0: "CODE", 1: "Description" }),
    sparse(7, { 0: "017301", 1: "Renew fence panel", 6: "1.8m" }),
  ],
  expectedAddress: "",
  expected: [
    {
      code: "017301",
      description: "Renew fence panel",
      comments: "1.8m",
    },
  ],
};

export const jobType6: JobFixture = {
  name: "type 6 Hammersmith SOR No",
  sheets: ["Job"],
  rows: [
    sparse(4, { 1: "Property Address:", 3: "4 River Walk" }),
    sparse(4, { 1: "SOR No", 3: "Description" }),
    sparse(4, { 1: "603101", 2: "Renew gutter" }),
  ],
  expectedAddress: "4 River Walk",
  expected: [
    {
      code: "603101",
      description: "Renew gutter",
      comments: "",
    },
  ],
};

export const jobType7: JobFixture = {
  name: "type 7 Mears Code in column 2",
  sheets: ["Job"],
  rows: [
    sparse(7, { 1: "Site address 9 Hill Road" }),
    sparse(7, { 2: "Code", 1: "Description" }),
    sparse(7, { 2: "070115", 1: "Renew hasp and padlock", 6: "shed" }),
  ],
  expectedAddress: "Site address 9 Hill Road",
  expected: [
    {
      code: "070115",
      description: "Renew hasp and padlock",
      comments: "shed",
    },
  ],
};

export const allJobFixtures: JobFixture[] = [
  jobType1,
  jobType2,
  jobType3,
  jobType4,
  jobType5,
  jobType6,
  jobType7,
];
