// Learn more: https://testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '',
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}))

// Mock framer-motion with stable memoized component identity per HTML tag
jest.mock('framer-motion', () => {
  const React = jest.requireActual('react');
  const componentCache = new Map();

  const motion = new Proxy({}, {
    get: (_target, tag) => {
      if (componentCache.has(tag)) {
        return componentCache.get(tag);
      }
      const MotionComponent = React.forwardRef(function MockMotion({ children, ...props }, ref) {
        const {
          initial,
          animate,
          exit,
          transition,
          whileHover,
          whileTap,
          layoutId,
          drag,
          dragConstraints,
          dragElastic,
          onDragEnd,
          onAnimationComplete,
          ...cleanProps
        } = props;
        void initial;
        void animate;
        void exit;
        void transition;
        void whileHover;
        void whileTap;
        void layoutId;
        void drag;
        void dragConstraints;
        void dragElastic;
        void onDragEnd;
        void onAnimationComplete;
        const originalClassName = cleanProps.className || "";
        const className = originalClassName ? `motion-${String(tag)} ${originalClassName}` : `motion-${String(tag)}`;
        return React.createElement(String(tag), { ...cleanProps, ref, className }, children);
      });
      componentCache.set(tag, MotionComponent);
      return MotionComponent;
    }
  });

  return {
    motion,
    AnimatePresence: ({ children }) => children,
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: (_value, _inputRange, outputRange) => {
      return outputRange[0];
    },
  };
})
