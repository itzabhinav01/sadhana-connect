// The official jest mock (react-native-safe-area-context/jest/mock)
// ships as `export default {...}` — unwrapped here so a plain
// `require('react-native-safe-area-context')` (as Babel's CJS interop
// produces for a named `import { useSafeAreaInsets } from '...'`)
// resolves the flat object directly. Jest auto-applies this file for
// every import of the real package (manual mock convention:
// <rootDir>/__mocks__/<package-name>.js), no per-test jest.mock()
// needed. Without it, useSafeAreaInsets() (used by StickyFooterBar)
// throws outside a real <SafeAreaProvider>.
module.exports = require('react-native-safe-area-context/jest/mock').default
