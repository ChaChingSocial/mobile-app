import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';

import { MentionList } from './MentionList';
import { fetchAllUserDisplayNames } from '@/lib/api/user';
import { sendNotification } from '@/lib/api/notifications';

export default (postId) => ({
    items: async ({ query }) => {
        const users = await fetchAllUserDisplayNames();
        return users
          .filter((user) => user.displayName.toLowerCase().startsWith(query.toLowerCase()))
          .slice(0, 5);
    },

    render: () => {
        let reactRenderer;
        let popup;

        return {
            onStart: (props) => {
                if (!props.clientRect) {
                    return;
                }

                reactRenderer = new ReactRenderer(MentionList, {
                    props: { ...props, postId }, // Pass postId to MentionList
                    editor: props.editor,
                });

                popup = tippy('body', {
                    getReferenceClientRect: props.clientRect,
                    appendTo: () => document.body,
                    content: reactRenderer.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: 'manual',
                    placement: 'bottom-start',
                });
            },

            onUpdate(props) {
                if (!reactRenderer) {
                    return;
                }

                reactRenderer.updateProps({ ...props, postId }); // Pass postId to MentionList

                if (!props.clientRect) {
                    return;
                }

                popup[0].setProps({
                    getReferenceClientRect: props.clientRect,
                });
            },

            onKeyDown(props) {
                if (!reactRenderer) {
                    return false;
                }

                if (props.event.key === 'Escape') {
                    popup[0].hide();
                    return true;
                }

                return reactRenderer.ref?.onKeyDown(props);
            },

            onExit() {
                if (popup) {
                    popup[0].destroy();
                }
                if (reactRenderer) {
                    reactRenderer.destroy();
                }
            },
        };
    },
});
