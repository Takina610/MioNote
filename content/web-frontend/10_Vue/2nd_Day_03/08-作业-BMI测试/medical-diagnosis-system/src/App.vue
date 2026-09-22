<template>
  <div id="app">
    <h1>医疗诊断系统</h1>
    <form @submit.prevent="diagnose">
      <div>
        <label for="name">姓名:</label>
        <input id="name" v-model="patient.name" required>
      </div>
      <div>
        <label for="age">年龄:</label>
        <input id="age" type="number" v-model.number="patient.age" required>
      </div>
      <div>
        <label for="height">身高 (cm):</label>
        <input id="height" type="number" v-model.number="patient.height" required>
      </div>
      <div>
        <label for="weight">体重 (kg):</label>
        <input id="weight" type="number" v-model.number="patient.weight" required>
      </div>
      <div>
        <label for="history">病史:</label>
        <textarea id="history" v-model="patient.history"></textarea>
      </div>
      <button type="submit">提交诊断</button>
    </form>
    <div v-if="diagnosis">
      <h2>{{ patient.name }}的诊断结果: {{ diagnosis }}</h2>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      patient: {
        name: '',
        age: 0,
        height: 0.0,
        weight: 0.0,
        history: ''
      },
      diagnosis: ''
    }
  },
  methods: {
    diagnose() {
      // 身高单位转换：厘米转为米
      const heightInMeters = this.patient.height / 100;
      const bmi = this.patient.weight / (heightInMeters * heightInMeters);
      if (bmi <= 18.5) {
        this.diagnosis = '体重过轻';
      } else if (bmi <= 24.9) {
        this.diagnosis = '正常';
      } else if (bmi <= 29.9) {
        this.diagnosis = '体重过重';
      } else {
        this.diagnosis = '肥胖';
      }
    }
  }
}
</script>

<style>
/* 可以添加一些样式来改善视觉效果 */
#app {
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
  background-color: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

h1 {
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

form {
  display: flex;
  flex-direction: column;
}

form > div {
  margin-bottom: 15px;
}

label {
  margin-bottom: 5px;
  font-weight: bold;
  color: #444;
}

input[type="text"],
input[type="number"],
textarea {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

textarea {
  resize: vertical;
  height: 100px;
}

button {
  cursor: pointer;
  font-size: 18px;
  color: white;
  background-color: #4CAF50;
  border: none;
  border-radius: 4px;
  padding: 10px;
  margin-top: 10px;
  transition: background-color 0.3s ease;
}

button:hover {
  background-color: #45a049;
}

h2 {
  text-align: center;
  color: #d32f2f;
  margin-top: 20px;
}
</style>
