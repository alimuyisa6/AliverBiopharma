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
      // Check if going back
      const navigationType = window.performance?.getEntriesByType?.('navigation')[0]?.type;
      setIsBack(navigationType === 'back_forward');
      
      setTransitionStage('pageOut');
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage('pageIn');
        transitionTimeoutRef.current = null;
      }, 300); // Half of transition duration
    }

    return () => {
      clearTimeout(transitionTimeoutRef.current);
    };
  }, [location, displayLocation]);

  useEffect(() => () => clearTimeout(transitionTimeoutRef.current), []);

  return (
    <div
      className={`page-transition ${
        transitionStage === 'pageOut' 
          ? isBack ? 'page-out-back' : 'page-out-forward'
          : isBack ? 'page-in-back' : 'page-in-forward'
      }`}
    >
      {children}
    </div>
  );
}

export default PageTransition;
