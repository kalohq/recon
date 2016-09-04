const Path = require('path');

function relPath(rel) {
  return Path.resolve(__dirname, rel);
}

module.exports = {
  data: {
    modules: [
      {path: relPath('./src/app.js')},
      {path: relPath('./src/avatar.js')},
      {path: relPath('./src/user-list.js')},
      {path: relPath('./src/list.js')},
      {path: relPath('./src/button.js')},
    ],
    components: [
      {
        name: 'App',
        dependencies: [
          {name: 'div'},
          {name: 'h1'},
          {name: 'h2'},
          {
            name: 'Button',
            component: {id: 'button.js::Button'},
          },
          {
            name: 'UserList',
            component: {id: 'user-list.js::UserList'},
          },
          {
            name: 'Notes',
            component: {id: 'notes.js::Notes'},
          },
        ],
      },
      {
        name: 'ListItem',
        dependencies: [
          {name: 'li'},
        ],
        dependants: [
          {
            name: 'ListItem',
            component: {id: 'notes.js::NoteItem'},
            usages: [
              {props: [{name: 'type', valueType: 'StringLiteral'}]},
            ],
          },
          {
            name: 'ListItem',
            component: {id: 'user-list.js::UserItem'},
            usages: [
              {props: [{name: 'type', valueType: 'StringLiteral'}]},
            ],
          },
        ],
      },
    ],
  },
};
