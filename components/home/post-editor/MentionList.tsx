import { Paper, Button } from '@mantine/core';
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useState,
} from 'react';
import styles from './MentionList.module.css'; // Import as a module

export const MentionList = forwardRef((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = index => {
        const item = props.items[index];

        if (item) {
            props.command({ id: item.userId, label: item.displayName });
        }
    };

    const upHandler = () => {
        setSelectedIndex(((selectedIndex + props.items.length) - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }

            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }

            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }

            return false;
        },
    }));

    return (
      <Paper className={styles['dropdown-menu']}>
          {props.items.length
            ? props.items.map((item, index) => (
              <Button
                variant="subtle"
                className={`${styles.item} ${index === selectedIndex ? styles['is-selected'] : ''}`}
                key={index}
                onClick={() => selectItem(index)}
              >
                  {item.displayName}
              </Button>
            ))
            : <div className={styles.item}>No result</div>
          }
      </Paper>
    );
});
