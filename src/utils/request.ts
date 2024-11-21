import { useUserStore } from '@/stores'
import router from '@/router'
import axios from 'axios'
import { showToast } from 'vant'

const baseURL = 'https://consult-api.itheima.net/'

// 1. axios实例，基础配置
const instance = axios.create({
	baseURL: baseURL,
	timeout: 10000
})

// 2. 请求拦截器给config携带token
instance.interceptors.request.use(
	(config) => {
		const store = useUserStore()
		if (store.user?.token && config.headers) {
			// 用户存在且有token 且 config有headers，则给headers新增属性Authorization
			config.headers['Authorization'] = `Bearer ${store.user?.token}`
		}
		return config
	},
	(err) => Promise.reject(err)
)

// 3. 响应拦截器，剥离无效数据，401拦截
instance.interceptors.response.use(
	(res) => {
		// 后台约定，响应成功，但是code不是10000，是业务逻辑失败
		if (res.data?.code !== 10000) {
			showToast(res.data?.message || '业务失败')
			return Promise.reject(res.data)
		}
		// 业务逻辑成功，返回响应数据，作为axios成功的结果
		return res.data
	},
	(err) => {
		if (err.response.status === 401) {
			// 删除用户信息
			const store = useUserStore()
			store.delUser()
			// 跳转登录，带上接口失效所在页面的地址，登录完成后回跳使用
			router.push({
				path: '/login',
				query: { returnUrl: router.currentRoute.value.fullPath }
			})
		}
		return Promise.reject(err)
	}
)

type Data<T> = {
	code: number
	message: string
	data: T
}
// 4. 请求工具函数
const request = <T>(url: string, method: string, submitData?: object) => {
	return instance.request<T, Data<T>>({
		url,
		method,
		[method.toLowerCase() === 'get' ? 'params' : 'data']: submitData
	})
}

export { baseURL, instance, request }
