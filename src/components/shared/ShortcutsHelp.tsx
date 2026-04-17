import { Modal } from './Modal';

export interface ShortcutGroup {
  title: string;
  items: Array<{ keys: string[]; description: string }>;
}

const DEFAULT_SHORTCUTS: ShortcutGroup[] = [
  {
    title: 'Views',
    items: [
      { keys: ['1'], description: 'Book view' },
      { keys: ['2'], description: 'List view' },
      { keys: ['3'], description: 'Quotes view' },
      { keys: ['4'], description: 'Calendar view' },
      { keys: ['5'], description: 'People view' },
      { keys: ['6'], description: 'Themes view' },
      { keys: ['7'], description: 'References view' },
      { keys: ['8'], description: 'Insights view' },
    ],
  },
  {
    title: 'Create',
    items: [
      { keys: ['n'], description: 'New lesson' },
      { keys: ['s'], description: 'New source' },
      { keys: ['r'], description: 'New reference' },
      { keys: ['t'], description: 'New theme' },
      { keys: ['e'], description: 'Edit year summary / theme-of-year' },
    ],
  },
  {
    title: 'Navigation',
    items: [
      { keys: ['/'], description: 'Focus search' },
      { keys: ['i'], description: 'Toggle "important only" filter' },
      { keys: ['p'], description: 'Toggle paper mode (Book view)' },
      { keys: ['j'], description: 'Next lesson' },
      { keys: ['k'], description: 'Previous lesson' },
      { keys: ['f'], description: 'Toggle important on focused lesson' },
      { keys: ['Enter'], description: 'Open focused lesson' },
      { keys: ['Esc'], description: 'Close modal / clear search' },
    ],
  },
  {
    title: 'Other',
    items: [
      { keys: ['?'], description: 'Show this help overlay' },
      { keys: ['Ctrl', 'S'], description: 'Force-save' },
    ],
  },
];

interface ShortcutsHelpProps {
  onClose: () => void;
  shortcuts?: ShortcutGroup[];
}

export function ShortcutsHelp({
  onClose,
  shortcuts = DEFAULT_SHORTCUTS,
}: ShortcutsHelpProps) {
  return (
    <Modal title="Keyboard Shortcuts" onClose={onClose} size="md">
      <div className="cp-shortcuts">
        {shortcuts.map((group) => (
          <section key={group.title} className="cp-shortcut-group">
            <h4 className="cp-shortcut-title">{group.title}</h4>
            <ul>
              {group.items.map((item, idx) => (
                <li key={idx} className="cp-shortcut-row">
                  <span className="cp-shortcut-keys">
                    {item.keys.map((k, i) => (
                      <kbd key={i} className="cp-kbd">
                        {k}
                      </kbd>
                    ))}
                  </span>
                  <span className="cp-shortcut-desc">{item.description}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
