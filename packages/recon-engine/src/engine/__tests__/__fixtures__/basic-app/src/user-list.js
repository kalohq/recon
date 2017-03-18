/* eslint-disable */
import React from 'react';
import Button from './button';
import List, {ListItem} from './list';

function UserItem({user}) {
  return (
    <ListItem type="grid">
      <Avatar src={user.avatar} />
      <span>{user.name}</span>
      <Button theme="danger">Remove User</Button>
    </ListItem>
  );
}

export default function UserList({users}) {
  return (
    <List type="grid">
      {users.map(user => {
        return <UserItem user={user} key={user.id} />;
      })}
    </List>
  );
}
