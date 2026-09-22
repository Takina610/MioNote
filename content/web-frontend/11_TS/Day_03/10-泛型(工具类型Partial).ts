interface Props {
  id: string
  name: string
}

// Partial工具类型可以将所有属性变为可选
type PartialProps = Partial<Props>

let p1: Props = {
  id: '1',
  name: '2'
}

let p2: PartialProps = {
  id: '1'
}

export {}
