import {
  BookOpenIcon,
  BookmarkIcon,
  QuillIcon,
  StarOutlineIcon,
  TagIcon,
  UserSilhouetteIcon,
  CalendarIcon,
  LinkChainIcon,
} from '../../lib/icons';
import type { FC, SVGProps } from 'react';

type IconComponent = FC<SVGProps<SVGSVGElement> & { size?: number }>;

interface IconChoice {
  name: string;
  component: IconComponent;
}

const ICON_CHOICES: IconChoice[] = [
  { name: 'book-open', component: BookOpenIcon },
  { name: 'bookmark', component: BookmarkIcon },
  { name: 'quill', component: QuillIcon },
  { name: 'star', component: StarOutlineIcon },
  { name: 'tag', component: TagIcon },
  { name: 'user', component: UserSilhouetteIcon },
  { name: 'calendar', component: CalendarIcon },
  { name: 'link', component: LinkChainIcon },
];

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div className="cp-icon-picker">
      {ICON_CHOICES.map(({ name, component: Icon }) => {
        const isActive = name === value;
        return (
          <button
            key={name}
            type="button"
            className={`cp-icon-swatch ${isActive ? 'active' : ''}`}
            onClick={() => onChange(name)}
            aria-label={name}
            aria-pressed={isActive}
            title={name}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
}
