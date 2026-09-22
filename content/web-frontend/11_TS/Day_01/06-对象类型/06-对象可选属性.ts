function myAxios(config: {url: string, method?: string}) {
  console.log(config)
}

myAxios({url: 'http://www.baidu.com'})
myAxios({url: 'http://www.baidu.com', method: 'get'})
