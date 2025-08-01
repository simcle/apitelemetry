import DigestFetch from 'digest-fetch'



const username = 'admin'
const password = 'satcomm19284637'

const client = new DigestFetch(username, password)

export const ptzControl = async (request, reply) => {
    const camera_ip = request.params.ip
    try {
        const xml = request.body

         const res = await client.fetch(`http://${camera_ip}/ISAPI/PTZCtrl/channels/1/continuous`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/xml' },
            body: xml
        })

        const text = await res.text()
        console.log('success', text)
        reply.code(res.status).send(text)
        
    } catch (error) {
        console.log(error)
    }
}