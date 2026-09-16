'use client';

import { 
  useRouter, 
  usePathname, 
  useParams as nextUseParams, 
  useSearchParams 
} from 'next/navigation';

export const useNavigate = () => {
  const router = useRouter();
  return (to, options) => {
    if (typeof to === 'number') {
      if (to === -1) router.back();
      // forward navigation not easily supported in a simple way
      return;
    }
    const href = typeof to === 'string' ? to : to.pathname;
    if (options?.replace) {
      router.replace(href);
    } else {
      router.push(href);
    }
  };
};

export const useLocation = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return {
    pathname,
    search: searchParams.toString() ? `?${searchParams.toString()}` : '',
    hash: '', // not easily available via next/navigation
    state: null, // not easily available via next/navigation
    key: 'default'
  };
};

export const useParams = nextUseParams;
export { usePathname, useSearchParams };

import NextLink from 'next/link';

export const Link = ({ to, href, children, ...props }) => {
  return <NextLink href={to || href} {...props}>{children}</NextLink>;
};

// Mock NavLink (minimum needed)
export const NavLink = ({ to, children, className, ...props }) => {
  const pathname = usePathname();
  const isActive = pathname === to;
  const activeClass = typeof className === 'function' ? className({ isActive }) : className;
  return (
    <Link to={to} className={activeClass} {...props}>
      {children}
    </Link>
  );
};

export const Navigate = ({ to, replace }) => {
  const router = useRouter();
  if (typeof window !== 'undefined') {
    if (replace) router.replace(to);
    else router.push(to);
  }
  return null;
};
