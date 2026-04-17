// Central SVG icon set. Inline components, stroke="currentColor" so icons
// inherit the surrounding text color.
//
// Convention: 16×16 viewBox, 1.5 stroke. Override size via `size` prop.

import type { SVGProps } from 'react';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  size?: number;
}

function svg(props: IconProps, children: React.ReactNode) {
  const { size = 16, ...rest } = props;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const BookOpenIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <path d="M2 3.5A1.5 1.5 0 0 1 3.5 2H7v11H3.5A1.5 1.5 0 0 1 2 11.5v-8Z" />
      <path d="M14 3.5A1.5 1.5 0 0 0 12.5 2H9v11h3.5a1.5 1.5 0 0 0 1.5-1.5v-8Z" />
    </>,
  );

export const StarFilledIcon = (p: IconProps) => {
  const { size = 16, ...rest } = p;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      {...rest}
    >
      <path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12.3 3.8 14.5l.8-4.7L1.2 6.5l4.7-.7L8 1.5Z" />
    </svg>
  );
};

export const StarOutlineIcon = (p: IconProps) =>
  svg(
    p,
    <path d="M8 1.5l2.1 4.3 4.7.7-3.4 3.3.8 4.7L8 12.3 3.8 14.5l.8-4.7L1.2 6.5l4.7-.7L8 1.5Z" />,
  );

export const QuillIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <path d="M14 2c-5 1-9 5-10 10l-2 2 1.5 1.5 2-2c5-1 9-5 10-10L14 2Z" />
      <path d="M5 11l3 3" />
    </>,
  );

export const BookmarkIcon = (p: IconProps) =>
  svg(p, <path d="M4 2h8v12l-4-3-4 3V2Z" />);

export const CalendarDotIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <rect x="2" y="3" width="12" height="11" rx="1" />
      <path d="M5 1v3M11 1v3M2 6h12" />
      <circle cx="8" cy="10" r="1" fill="currentColor" />
    </>,
  );

export const CalendarIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <rect x="2" y="3" width="12" height="11" rx="1" />
      <path d="M5 1v3M11 1v3M2 6h12" />
    </>,
  );

export const LinkChainIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <path d="M7 9a3 3 0 0 0 4 0l2-2a3 3 0 0 0-4-4l-1 1" />
      <path d="M9 7a3 3 0 0 0-4 0L3 9a3 3 0 0 0 4 4l1-1" />
    </>,
  );

export const TagIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <path d="M2 2h6l6 6-6 6-6-6V2Z" />
      <circle cx="5" cy="5" r="1" />
    </>,
  );

export const UserSilhouetteIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3 3-5 6-5s6 2 6 5" />
    </>,
  );

export const DropCapIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <path d="M3 2h5v12H3z" />
      <path d="M10 5h4M10 8h4M10 11h4" />
    </>,
  );

export const SearchIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <circle cx="7" cy="7" r="4.5" />
      <line x1="10.5" y1="10.5" x2="14" y2="14" />
    </>,
  );

export const CloseIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <line x1="3" y1="3" x2="13" y2="13" />
      <line x1="13" y1="3" x2="3" y2="13" />
    </>,
  );

export const PlusIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <line x1="8" y1="2" x2="8" y2="14" />
      <line x1="2" y1="8" x2="14" y2="8" />
    </>,
  );

export const MinusIcon = (p: IconProps) =>
  svg(p, <line x1="2" y1="8" x2="14" y2="8" />);

export const CheckIcon = (p: IconProps) =>
  svg(p, <polyline points="3,8 7,12 13,4" />);

export const DownloadIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <line x1="8" y1="2" x2="8" y2="10" />
      <polyline points="4,7 8,11 12,7" />
      <line x1="2" y1="14" x2="14" y2="14" />
    </>,
  );

export const TrashIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <line x1="2" y1="4" x2="14" y2="4" />
      <path d="M4 4v10c0 0.5 0.5 1 1 1h6c0.5 0 1-0.5 1-1V4" />
      <line x1="6" y1="7" x2="6" y2="12" />
      <line x1="10" y1="7" x2="10" y2="12" />
      <path d="M6 4V2h4v2" />
    </>,
  );

export const EditIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <path d="M11 2l3 3-8 8H3v-3l8-8Z" />
    </>,
  );

export const SettingsIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v3M8 12v3M1 8h3M12 8h3M3.5 3.5l2 2M10.5 10.5l2 2M3.5 12.5l2-2M10.5 5.5l2-2" />
    </>,
  );

export const KeyboardIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <rect x="1" y="4" width="14" height="9" rx="1" />
      <line x1="4" y1="7" x2="4" y2="7" />
      <line x1="7" y1="7" x2="7" y2="7" />
      <line x1="10" y1="7" x2="10" y2="7" />
      <line x1="4" y1="10" x2="12" y2="10" />
    </>,
  );

export const MenuIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <line x1="2" y1="4" x2="14" y2="4" />
      <line x1="2" y1="8" x2="14" y2="8" />
      <line x1="2" y1="12" x2="14" y2="12" />
    </>,
  );

export const ChevronLeftIcon = (p: IconProps) =>
  svg(p, <polyline points="10,3 5,8 10,13" />);

export const ChevronRightIcon = (p: IconProps) =>
  svg(p, <polyline points="6,3 11,8 6,13" />);

export const ChevronDownIcon = (p: IconProps) =>
  svg(p, <polyline points="3,6 8,11 13,6" />);

export const FilterIcon = (p: IconProps) =>
  svg(p, <polygon points="1,3 15,3 10,9 10,14 6,12 6,9" />);

export const InfoIcon = (p: IconProps) =>
  svg(
    p,
    <>
      <circle cx="8" cy="8" r="6.5" />
      <line x1="8" y1="7" x2="8" y2="11" />
      <circle cx="8" cy="5" r="0.5" fill="currentColor" />
    </>,
  );
