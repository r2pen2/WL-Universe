// The sites' tests were written for Jest (Create React App). Vitest's `vi` covers the Jest API
// they use (jest.fn, jest.mock, jest.spyOn), so expose it under the old name.
import { vi } from "vitest";

globalThis.jest = vi;
