import { faker } from '@faker-js/faker';

export const documentFactory = (uploaderId: number) => {
  return {
    title: faker.system.fileName().split('.')[0] + '.txt',
    content: Buffer.from(
      faker.lorem.paragraphs(faker.number.int({ min: 1, max: 3 })),
    ),
    uploaderId,
  };
};

export const manyDocumentsFactory = (count: number, uploaderId: number) => {
  return Array.from({ length: count }, () => documentFactory(uploaderId));
};
