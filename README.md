# Orchiee

**Framework-agnostic action orchestrator with an awesome type support**

[![Deploy Orchiee](https://github.com/chris-czopp/orchiee/actions/workflows/deploy.yml/badge.svg)](https://github.com/chris-czopp/orchiee/actions/workflows/deploy.yml) 
[![NPM Version](https://img.shields.io/npm/v/@gluecodes/orchiee.svg?style=flat)](https://www.npmjs.com/package/@gluecodes/orchiee)


## Installation

```bash
npm install --save @gluecodes/orchiee
```

## Usage

```typescript
import * as Fn from '@gluecodes/orchiee';

const someAction = async (): SomeType => {}
const observedSomeAction = Fn.be(someAction)

Fn.observe(Fn.calling(observedSomeAction), (isBeingCalled) => {
  // isBeingCalled is Boolean type
})

Fn.observe(Fn.called(observedSomeAction), (itsReturnedValue) => {
  // itsReturnedValue is SomeType and it's taken from someAction
})

Fn.observe(Fn.failed(observedSomeAction), (error) => {
  // error is Error type
})

Fn.observe(Fn.called(observedSomeAction, Fn.called(action1), Fn.called(action2)), (itsReturnedValue) => {
  // when action1() or action2() is triggered, this callback is triggered
})

// on cleanup of your framework
Fn.cleanup() // clears all listeners
```

## License

[MIT](https://github.com/gluecodes/orchiee/blob/master/LICENSE.md)
