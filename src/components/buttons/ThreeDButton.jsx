import Button from '../Button/Button';

/**
 * Brand-aware 3D action button.
 * Uses the existing Button component so loading, status, refs, native button
 * attributes and form behaviour remain consistent with the rest of the site.
 */
export default function ThreeDButton({
  variant = 'solid',
  size = 'md',
  className = '',
  ...props
}) {
  const tone = ['solid', 'soft', 'muted'].includes(variant) ? variant : 'solid';
  const sizeClass = size === 'sm' ? 'three-d-button--sm' : size === 'lg' ? 'three-d-button--lg' : '';

  return (
    <Button
      {...props}
      variant="3d"
      className={['three-d-button', `three-d-button--${tone}`, sizeClass, className].filter(Boolean).join(' ')}
    />
  );
}
