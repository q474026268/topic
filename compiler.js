

// 词法解析之tokenizer实现
function tokenizer(input) {
  // 一个current变量，类似于游标，用于跟踪我们在代码字符串中的位置
  let current = 0;

  // tokens数组，用于将我们分解的标记存放其中
  let tokens = [];

  // 我们创建一个while循环，在这里面我们设置我们的current变量，这个变量会随着循环的深入而不断增加
  // 这么做是因为tockens可能会是任意长度
  while (current < input.length) {

    // 我们还会存储变量current所在位置的字符
    let char = input[current];

    // 我们首先要检查的是左括弧，这个将会在稍后用于CallExpression，但是此时我们只关心左括弧字符
    // 我们检查看看有没有左括弧:
    if (char === '(') {
      // 如果有，则建立一个对象，其type属性是paren，值为左括弧, 然后我们将这个对象加入tokens数组
      tokens.push({
        type: 'paren',
        value: '('
      });


      // 接着我们增加current变量，也就是移动游标
      current++;

      // 然后进行下一轮循环
      continue;
    }

    // 接着我们检查右括弧，我们按照前面的套路来做：检查右括弧，新增一个标记，增加current, 进行下一轮循环
    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')'
      });
      current++;
      continue;
    }

    // 接着，我们检查空白格。 这很有趣，因为我们关注空白格是因为它将字符串分隔开，但是我们并不需要将空白格存为标记,我们
    // 可以直接扔掉它，所以这里我们仅仅检查空白格是否存在，如果它存在我们就进入下一轮循环
    let WHITESPACE = /\s/;
    if (WHITESPACE.test(char)) {
      current++;
      continue;
    }

    // 下一个类型的标记是数字，这和我们前面见到的不同，因为一个数字可能是任意个字符组成，并且我们需要捕获整个字符序列作为一个标记
    //
    //   (add 123 456)
    //        ^^^ ^^^
    //  比如上面的就只有两个独立的数字标记
    //
    // 所以当我们遇到序列中的第一个数字的时候开始进一步处理.
    let NUMBERS = /[0-9]/;
    if (NUMBERS.test(char)) {

      // 我们在这里面创建了一个value字符，用于拼接数字字符
      let value = '';

      // 接下来我们遍历后面的每一个字符直到遇到一个非数字字符，将这些字符和前面的value变量拼接起来, 并且改变current游标
      while (NUMBERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // 这之后我们将创建数字标记并加入tokens数组
      tokens.push({ type: 'number', value });

      // 然后我们继续
      continue;
    }


    // 我们也支持字符串，字符串就是用双引号(")包裹的一段文本，比如
    //
    //   (concat "foo" "bar")
    //            ^^^   ^^^ 字符串标记
    //
    // 我们先检查左双引号:

    if (char === '"') {

      // 创建一个value变量用于保存字符串.
      let value = '';

      // 我们将忽略双引号，因为我们关心的是双引号包裹的文本.
      char = input[++current];

      // 然后我们遍历后面的字符串，直到我们遇到右双引号
      while (char !== '"') {
        value += char;
        char = input[++current];
      }
      // 忽略右双引号，同理，因为我们关心的是双引号包裹的文本.
      char = input[++current];

      // 创建类型为string的标记，并放进tockens数组
      token.push({ type: 'string', value });

      continue;
    }

    // 最后一种类型的标记是name标记，这是一串字符而不是数字,也就是lisp语法中的函数名
    //
    //   (add 2 4)
    //    ^^^
    //    name 标记
    //
    let LETTERS = /[a-z]/i;
    if (LETTERS.test(char)) {
      let value = '';

      // 同理，我们遍历，并将它们拼接起来
      while (LETTERS.test(char)) {
        value += char;
        char = input[++current];
      }

      // 并且创建一个类型为name的标记，存储于tokens数组
      tokens.push({ type: 'name', value });
      continue;
    }
    // 最后，如果我们到这里还没有匹配一个字符, 我们将抛出一个错误然后退出
    throw new TypeError("I dont know what this character is:" + char);
  }

  // 在tokenizer函数的末尾我们将tokens数组返回
  return tokens;
}


// 句法解析之parser实现
function parser(tokens) {

  // 同样我们维持一个current变量用作游标
  let current = 0;

  // 但是这次我们使用递归而不是while循环，所以我们定义了walk函数
  function walk() {

    // 在walk函数内部，我们首先拿到tokens数组中current索引处存放的标记
    let token = tokens[current];

    // 我们将把每种类型的标记以另外一种结构关系存储，以体现句法关系
    // 首先从数字token开始
    //
    // 我们检查看有没有数字token
    if (token.type === 'number') {

      // 如果有，我们移动游标
      current++;

      // 并且我们会返回一个叫做"NumberLiteral"的新的AST节点并且将它的value属性设置为我们标记对象的value属性
      return { type: 'NumberLiteral', value: token.value };
    }

    // 如果我们有string类型的标记，我们会和数字类型类似，创建一个叫做"StringLiteral"的AST节点
    if (token.type === 'string') {
      current++;

      return { type: 'StringLiteral', value: token.value }
    }

    // 接下来我们查找CallExpressions. 我们是通过左括弧来开始这个过程的
    // 接下来我们查找CallExpressions. 我们是通过左括弧来开始这个过程的
    if (
      token.type === 'paren' &&
      token.value === '('
    ) {

      // 我们将忽略左括弧，因为在AST里面，AST就是有句法关系的，所以我们不关心左括弧本身了
      token = tokens[++current];

      // 我们创建一个叫做CallExpression的基础节点，并且将节点的名字设置为当前标记的value属性，
      // 因为左括弧标记的下一个标记就是函数名字
      let node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      };

      // 我们移动游标，忽略掉name标记，因为函数名已经存起在CallExpression中了
      token = tokens[++current];

      // 然后现在我们遍历每一个标记，找到CallExpression的参数直至遇到右括弧
      //
      // 现在，这里就是递归出场的地方了，为了避免陷入无限的嵌套节点解析，我们采用递归的方式来搞定这个事情
      //
      // 为了更好的解释这个东西，我们以我们的Lisp代码举例，你可以看到，add的参数是一个数字以及一个嵌套的CallExpression，
      // 这个嵌套的函数调用包含它自己的数字参数
      //
      //   (add 2 (subtract 4 2))
      //
      // 你特可以从它的tokens数组中发现它有很多右括弧
      //
      //   [
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'add'      },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: '('        },
      //     { type: 'name',   value: 'subtract' },
      //     { type: 'number', value: '4'        },
      //     { type: 'number', value: '2'        },
      //     { type: 'paren',  value: ')'        }, <<< 右括弧
      //     { type: 'paren',  value: ')'        }, <<< 右括弧
      //   ]
      //
      // 我们将依赖于嵌套的walk函数来增加我们的游标

      // 所以我们创建一个while循环，这个while循环将一直进行直到遇到一个类型是paren的标记并且这个标记的值是一个右括弧
      while (
        (token.type !== 'paren') ||
        (token.type === 'paren' && token.value !== ')')
      ) {
        // 我们将调用walk函数，这个函数将返回一个节点, 我们将把这个返回的节点放到当前节点的params
        // 数组中存储起来，这样嵌套关系再AST里面就体现出来了
        node.params.push(walk());
        token = tokens[current];
      }

      // 最后，我们需要最后一次移动游标用于忽略右括弧
      current++;

      // 并且返回节点
      return node;
    }
    // 同样，如果我们没有识别出标记的类型，我们也会抛出一个错误
    throw new TypeError(token.type);
  }
  // 现在walk函数已经定义好了， 我们需要定义我们的AST树了，这个AST树有一个“Program”根节点：
  let ast = {
    type: 'Program',
    body: [],
  };

  // 然后我们要启动我们的walk函数, 将AST节点放入根节点的body数组里面
  //
  // 我们在循环里面做这个是因为，我们可能会遇到连着的多个函数调用，比如说像这样的：
  //
  //   (add 2 2)
  //   (subtract 4 2)
  //启动walk
  while (current < tokens.length) {
    ast.body.push(walk());
  }

  // 在解析函数的最后，我们将返回生成的AST.
  return ast;
}

console.log(parser(tokenizer('(add 2 (subtract 4 2))')));