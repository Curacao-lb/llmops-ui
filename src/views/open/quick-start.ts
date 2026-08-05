// 开放 API 快速开始示例代码

export const blockApiShell = `curl --location --request POST 'https://llmops.example.com/openapi/chat' \\
--header 'Authorization: Bearer pat_OYDacMzM3WyOWV3Dtj2bHRMymzxP****' \\
--header 'Content-Type: application/json' \\
--data-raw '{
    "app_id": "734829333445931****",
    "end_user_id": "123456789",
    "conversation_id": "123456789",
    "stream": false,
    "query": "广州今天的天气怎样"
}'`

export const blockApiOutput = `{
    "code": "success",
    "data": {
        "agent_thoughts": [
            {
                "created_at": 0,
                "event": "long_term_memory_recall",
                "id": "bb3af322-ee05-4914-b678-f9ab0c1100f2",
                "latency": 0,
                "observation": "",
                "thought": "",
                "tool": "",
                "tool_input": {}
            },
            {
                "created_at": 0,
                "event": "agent_message",
                "id": "2838d7e4-a368-4340-88d4-009245d895a1",
                "latency": 4.27,
                "observation": "",
                "thought": "广州今天多云转晴，气温 26~33℃，东南风 2 级，适合外出。",
                "tool": "",
                "tool_input": {}
            },
            {
                "created_at": 0,
                "event": "agent_end",
                "id": "1b963062-8623-4e6e-a65e-16249d1c1ee8",
                "latency": 0,
                "observation": "",
                "thought": "",
                "tool": "",
                "tool_input": {}
            }
        ],
        "answer": "广州今天多云转晴，气温 26~33℃，东南风 2 级，适合外出。",
        "conversation_id": "11356d51-7047-4668-9a7a-5fb6eb27e032",
        "end_user_id": "c63840ec-3362-4525-8fb3-eb99fded09c2",
        "id": "9ada9487-2274-4003-820b-b57997229ac8",
        "latency": 15.92,
        "query": "广州今天的天气怎样",
        "total_token_count": 0
    },
    "message": ""
}`

export const streamApiShell = `curl --location --request POST 'https://llmops.example.com/openapi/chat' \\
--header 'Authorization: Bearer pat_OYDacMzM3WyOWV3Dtj2bHRMymzxP****' \\
--header 'Content-Type: application/json' \\
--data-raw '{
    "app_id": "734829333445931****",
    "end_user_id": "123456789",
    "conversation_id": "123456789",
    "stream": true,
    "query": "广州今天的天气怎样"
}'`

export const streamApiOutput = `event: long_term_memory_recall
data: {"event": "long_term_memory_recall", "thought": "", "answer": "", "id": "8bfc7813", "conversation_id": "76cf52b8", "message_id": "ed221e86", "task_id": "03042ead"}

event: agent_message
data: {"event": "agent_message", "thought": "广州", "answer": "广州", "id": "0d290337", "conversation_id": "76cf52b8", "message_id": "ed221e86", "task_id": "03042ead"}

event: agent_message
data: {"event": "agent_message", "thought": "今天多云转晴。", "answer": "今天多云转晴。", "id": "0d290337", "conversation_id": "76cf52b8", "message_id": "ed221e86", "task_id": "03042ead"}

event: agent_end
data: {"event": "agent_end", "thought": "", "answer": "", "id": "020deae7", "conversation_id": "76cf52b8", "message_id": "ed221e86", "task_id": "03042ead"}`
