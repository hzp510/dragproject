import axios from 'axios' //引用axios
import qs from 'qs';


// axios 配置
const service = axios.create({
  baseURL: 'api',// api的base_url
  timeout: 30000 ,// 请求超时时间,

})

//整理数据
service.transformRequest = function (data) {
//data = Qs.stringify(data);
  data = JSON.stringify(data);
  return data;
};



// http request 拦截器（所有发送的请求都要从这儿过一次），通过这个，我们就可以把token传到后台，我这里是使用sessionStorage来存储token等权限信息和用户信息，若要使用cookie可以自己封装一个函数并import便可使用
service.interceptors.request.use(
  config => {
    //const token = sessionStorage.getItem("token"); //获取存储在本地的token
    config.headers['Content-Type'] = 'application/json;charset=UTF-8';
    //config.data = JSON.stringify(config.data);
    return config;
  },
  err => {
    return Promise.reject(err);
  }
);



// http response 拦截器（所有接收到的请求都要从这儿过一次）
service.interceptors.response.use(
  response => {
    return response.data;
  },
  error => {
    return Promise.reject(error.response)
  });

export default service;
