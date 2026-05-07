/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-wrapper-object-types */
import '@types/jest';
declare global {
  namespace jest {
    interface Expect {
      // Overload to return the instance type of the
      // constructor passed in, instead of 'any'.
      any<T>(
        type: { new (...args: any[]): T } | Function,
      ): T extends String
        ? string
        : T extends Number
          ? number
          : T extends Boolean
            ? boolean
            : T;

      toBeOneOf<T>(expected: readonly T[]): T;
    }
  }
}
