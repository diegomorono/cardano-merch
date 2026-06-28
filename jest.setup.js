// Learn more: https://github.com/testing-library/jest-dom
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
  useSearchParams: () => new URLSearchParams(),
}))

// Mock framer-motion for simpler testing
jest.mock('framer-motion', () => {
  const motion = new Proxy({}, {
    get: (target, tag) => {
      return ({ children, ...props }) => {
        // Remove framer-motion specific props that might cause react console warnings
        const { initial, animate, exit, transition, whileHover, whileTap, ...cleanProps } = props;
        const Tag = tag;
        const originalClassName = cleanProps.className || "";
        const className = originalClassName ? `motion-${tag} ${originalClassName}` : `motion-${tag}`;
        return <Tag {...cleanProps} className={className}>{children}</Tag>;
      };
    }
  });
  return {
    motion,
    AnimatePresence: ({ children }) => children,
    useScroll: () => ({ scrollYProgress: { get: () => 0 } }),
    useTransform: (value, inputRange, outputRange) => {
      return outputRange[0];
    },
  };
})