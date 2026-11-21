/* src/components/PageTransition.jsx */
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

function PageTransition({ children }) {
  const location = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState('pageIn');
  const [isBack, setIsBack] = useState(false);
  const transitionTimeoutRef = useRef(null);

  useEffect(() => {
    if (location.pathname !== displayLocation.pathname) {
      const navigationType = window.performance?.getEntriesByType?.('navigation')[0]?.type;
      setIsBack(navigationType === 'back_forward');
      setTransitionStage('pageOut');
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('pageIn');
        transitionTimeoutRef.current = null;
      }, 300);
    }
    return () => clearTimeout(transitionTimeoutRef.current);
  }, [location, displayLocation]);

  useEffect(() => () => clearTimeout(transitionTimeoutRef.current), []);

  const transitionClass = transitionStage === 'pageOut'
    ? isBack ? '-translate-x-2 opacity-0' : 'translate-x-2 opacity-0'
    : 'translate-x-0 opacity-100';

  return (
    <div className={`min-w-0 transition-[opacity,transform] duration-300 ease-out ${transitionClass}`}>
      {children}
    </div>
  );
}

export default PageTransition;
