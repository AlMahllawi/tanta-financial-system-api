import { faker } from '@faker-js/faker';

export const documentFactory = (uploaderId: number) => ({
  title: faker.system.fileName().split('.')[0] + '.pdf',
  content: Buffer.concat([
    Buffer.from('%PDF-1.4\n'),
    Buffer.from(faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 }))),
  ]),
  uploaderId,
});

export const manyDocumentsFactory = (count: number, uploaderId: number) =>
  Array.from({ length: count }, () => documentFactory(uploaderId));
