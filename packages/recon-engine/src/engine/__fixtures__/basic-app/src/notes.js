import React from 'react';
import List, {ListItem} from './list';
import {createContainer, query as q} from 'api/recall';
import {Note} from 'api/resources';

function NoteItem({note}) {
  return (
    <ListItem type="grid">
      <Avatar src={note.created_by.img} />
      <p>{note.content}</p>
    </ListItem>
  )
}

export function Notes({notes}) {
  return (
    <div>
      <h2>Notes</h2>
      <List type="grid">
        {notes.map(user => {
          return (
            <NoteItem note={note} key={user.id} />
          );
        })}
      </List>
    </div>
  )
}

const contain = createContainer({
  queries: {
    invoices: q.many(Note, {
      params: (vars) => ({
        filter: {
          parent: vars.parent
        }
      }),
      fields: {
        content: true,
        created_by: {
          img: true,
        },
      },
    }),
  },
});

export default contain(Notes);
