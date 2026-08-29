// The package's own mock.js (react-native-reanimated/mock) transitively
// imports the real native worklets runtime and crashes under jest-expo
// with this reanimated/worklets version combo. This is a small,
// self-contained replacement covering only what this app's components
// actually use (Animated.View passthrough + the entering/exiting/layout
// props used for the Accordion's expand/collapse, and useReducedMotion)
// — Jest auto-applies it for every `import ... from
// 'react-native-reanimated'` in tests (manual mock convention:
// <rootDir>/__mocks__/<package-name>.js), no per-test jest.mock() needed.
const React = require('react')
const { View } = require('react-native')

class ChainableAnimationMock {
  duration() {
    return this
  }
  delay() {
    return this
  }
  springify() {
    return this
  }
}

const AnimatedView = React.forwardRef((props, ref) => {
  // Strip reanimated-only props (entering/exiting/layout) so they don't
  // land on the underlying host View.
  const { entering, exiting, layout, ...rest } = props
  return React.createElement(View, { ...rest, ref })
})

module.exports = {
  __esModule: true,
  default: {
    View: AnimatedView,
  },
  useReducedMotion: () => false,
  FadeIn: new ChainableAnimationMock(),
  FadeOut: new ChainableAnimationMock(),
  LinearTransition: new ChainableAnimationMock(),
}
