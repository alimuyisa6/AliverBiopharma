/* src/components/Advertising/AdStepIcon.jsx */

const ICONS = {
organisation: (
<>
<path
d="M5 20V7.5L12 4l7 3.5V20"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
strokeLinecap="round"
strokeLinejoin="round"
/>
<path
d="M8 20v-4h8v4M9 9h1M14 9h1M9 12h1M14 12h1"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
strokeLinecap="round"
/>
<path
d="M3 20h18"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
strokeLinecap="round"
/>
</>
),

campaign: (
<>
<path
d="M5 6.5h14a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 16V8A1.5 1.5 0 0 1 5 6.5Z"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
/>
<path
d="M7 11h10M7 14h6"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
strokeLinecap="round"
/>
<path
d="M8 4.5h8"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
strokeLinecap="round"
/>
</>
),

audience: (
<>
<circle
cx="12"
cy="8"
r="3"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
/>
<path
d="M6.5 19c.5-3.2 2.3-5 5.5-5s5 1.8 5.5 5"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
strokeLinecap="round"
/>
<circle
cx="5"
cy="11"
r="2"
fill="none"
stroke="currentColor"
strokeWidth="1.5"
/>
<circle
cx="19"
cy="11"
r="2"
fill="none"
stroke="currentColor"
strokeWidth="1.5"
/>
<path
d="M2.8 18c.3-1.8 1.2-2.8 2.8-3M21.2 18c-.3-1.8-1.2-2.8-2.8-3"
fill="none"
stroke="currentColor"
strokeWidth="1.5"
strokeLinecap="round"
/>
</>
),

placement: (
<>
<rect
x="4"
y="5"
width="16"
height="14"
rx="1.5"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
/>
<path
d="M4 9h16M8 13h3M8 16h5"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
strokeLinecap="round"
/>
<path
d="M15.5 13.5h2.5M16.75 12.25v2.5"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
strokeLinecap="round"
/>
</>
),

review: (
<>
<path
d="M12 3.5 19 6v5.3c0 4.1-2.8 7.2-7 9.2-4.2-2-7-5.1-7-9.2V6l7-2.5Z"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
strokeLinejoin="round"
/>
<path
d="m8.5 12.5 2.3 2.3 4.8-5"
fill="none"
stroke="currentColor"
strokeWidth="1.8"
strokeLinecap="round"
strokeLinejoin="round"
/>
</>
),

reach: (
<>
<circle
cx="12"
cy="12"
r="7"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
/>
<circle
cx="12"
cy="12"
r="2.5"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
/>
<path
d="M12 5V2.5M12 21.5V19M5 12H2.5M21.5 12H19"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
strokeLinecap="round"
/>
<path
d="m16.5 7.5 3-3"
fill="none"
stroke="currentColor"
strokeWidth="1.7"
strokeLinecap="round"
/>
</>
),
};

export default function AdStepIcon({ name, size = 28, className = '' }) {
const icon = ICONS[name];

if (!icon) {
return null;
}

return (
<svg
className={className}
width={size}
height={size}
viewBox="0 0 24 24"
fill="none"
aria-hidden="true"
focusable="false"
>
{icon}
</svg>
);
}
