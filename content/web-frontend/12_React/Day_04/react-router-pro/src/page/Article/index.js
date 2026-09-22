import { useSearchParams, useParams } from 'react-router-dom'

const Article = () => {
  const [searchParams] = useSearchParams()
  const params = useParams()
  return (
    <div>
      <h1>文章页</h1>

      {/* searchParams传参 */}
      <p>(searchParams)文章id: {searchParams.get('id')}</p>
      <p>(searchParams)文章名称: {searchParams.get('name')}</p>

      {/* params传参 */}
      <p>(params)文章id: {params.id}</p>
      <p>(params)文章名称: {params.name}</p>
      
    </div>
  )
}

export default Article

