import "./main.css"

import * as THREE from 'three'
import * as dat from 'lil-gui'
// import gsap from 'gsap'
import * as CANNON from "cannon-es"
import CannonDebugger from 'cannon-es-debugger'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"

/**
 * Setup
 */
// three.js scene
const scene = new THREE.Scene()

// physic world setup
const world = new CANNON.World()
world.broadphase = new CANNON.SAPBroadphase(world)
world.allowSleep = true
world.gravity.set(0, -9.82, 0)

// physic world debugger 
const cannonDebugger = new CannonDebugger(scene, world)

// gui
const gui = new dat.GUI()
const debugObject = {}

/**
 *  global variable
 */
const objectsToUpdate = []
const intersectObjects = []
const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const sphereGeometry = new THREE.SphereGeometry(.5, 20, 20)
const material = new THREE.MeshStandardMaterial({color: '#777777',})
const strength = 500
const dt = 1 / 2
const raycaster = new THREE.Raycaster()

// force
const applyForce = (pBody) => {
   const topPoint = new CANNON.Vec3(0, 1, 0)
   const force = new CANNON.Vec3(-strength * dt, 10, 0)
   pBody.applyForce(force, topPoint) 
}

// mouse
const mouse = new THREE.Vector2()

// material
const defaultMaterial = new CANNON.Material('default')
const contactMaterial = new CANNON.ContactMaterial(
   defaultMaterial, 
   defaultMaterial, {
      friction: 0.1,
      restitution: 0.7
   }
)
world.addContactMaterial(contactMaterial)

// render scene 
const sizes = {
   width: window.innerWidth,
   height: window.innerHeight,
}
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(3, 5, -12)

/**
 *  lights
 */
const lights = () => {
   const ambientLight = new THREE.AmbientLight(0xffffff, 0.7)

   const dirLight = new THREE.DirectionalLight(0xffffff)
   dirLight.position.set(2, 5, 0)
   dirLight.castShadow = true
   dirLight.shadow.mapSize.set(1024, 1024)
   dirLight.shadow.camera.far = 15
   dirLight.shadow.camera.left = - 7
   dirLight.shadow.camera.top = 7
   dirLight.shadow.camera.right = 7
   dirLight.shadow.camera.bottom = - 7
   
   scene.add(ambientLight, dirLight)
}

/**
 * Raycaster (not done)
 */
// updating mouse coords
window.addEventListener('mousemove', (e) => {
   mouse.x = e.clientX / sizes.width * 2 - 1
   mouse.y = - e.clientY / sizes.height * 2 + 1
})

const updateRayCaster = () => {
   raycaster.setFromCamera(mouse, camera)

   // interSects = raycaster.intersectObjects(objectsToUpdate.obj)
   // if(interSects) {
   //    for(const intersect of interSects)
   //    {
   //       intersect.object.material.color.set('#0000ff')
   //    }
   // }
}


/**
 * Floor
 */
const floor = () => {
   // physic floor
   const pFloorShape = new CANNON.Plane()
   const pFloorBody = new CANNON.Body({
      material: defaultMaterial,
      mass: 0,
      shape: pFloorShape,
   })
   pFloorBody.quaternion.setFromAxisAngle(
      new CANNON.Vec3(-1, 0, 0),
      Math.PI * 0.5
   )
   world.addBody(pFloorBody)
   
   // three.js floor
   const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(20, 20, 20, 20),
      new THREE.MeshStandardMaterial({
         color: "#e0e0e0"
      })
   )
   floor.position.set(0, 0, 0)
   floor.rotation.x = - Math.PI * 0.5 
   floor.receiveShadow = true
   
   scene.add(floor)
}

/**
 * Box
 */
const createBox = (position) => {
   // Three js box   
   const box = new THREE.Mesh(
      boxGeometry,
      material
   )
   box.position.copy(position)
   box.castShadow = true
   scene.add(box)

   // physic box
   const pBoxShape = new CANNON.Box((new CANNON.Vec3(0.5, 0.5, 0.5)));
   const pBoxBody = new CANNON.Body({
      material: defaultMaterial,
      mass: 1,
      shape: pBoxShape
   })
   pBoxBody.position.copy(position)
   world.addBody(pBoxBody)

   objectsToUpdate.push({
      obj: box,
      objBody: pBoxBody
   })
   intersectObjects.push(box)
}

/**
 * Sphere
 */
const createSphere = () => {
   const damping = 0.5

   // three.js sphere
   const sphere = new THREE.Mesh(
      sphereGeometry,
      material
   )
   sphere.position.set(2, 0, 0)
   sphere.castShadow = true

   // physic sphere
   const pSphereShape = new CANNON.Sphere(0.5)
   const pSphereBody = new CANNON.Body({
      material: defaultMaterial,
      mass: 2,
      shape: pSphereShape
   })
   pSphereBody.angularDamping = damping
   pSphereBody.linearDamping = damping
   pSphereBody.position.set(2, 0, 0)
   pSphereBody.position.copy(sphere.position)

   Object.assign(debugObject, {
      applyForce: applyForce.bind(this, pSphereBody)
   })
   gui.add(debugObject, 'applyForce')

   objectsToUpdate.push({
      obj: sphere,
      objBody: pSphereBody
   })
   world.addBody(pSphereBody)
   scene.add(sphere)
}

window.addEventListener('load', () => {
   lights()
   floor()
   createSphere()
   for(let i = 0; i <= 3; i++) {
      for(let j = 0; j <= 3; j++) {
         createBox({x: i * -1, y: j * 1, z: 1})
         createBox({x: i * -1, y: j * 1, z: 2})
         createBox({x: i * -1, y: 0, z: 0})
      }
   }
   
})

/**
 * Rendering
 */
const canvas = document.querySelector('.webgl')
const renderer = new THREE.WebGLRenderer({
   canvas
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

const clock = new THREE.Clock()

let previousElpTime = 0

const tick = () =>
{
   const elapsedTime = clock.getElapsedTime()
   const deltaTime = elapsedTime - previousElpTime 
   previousElpTime = elapsedTime
    
    world.step(1/ 60, deltaTime, 3)
    cannonDebugger.update()

    for(const object of objectsToUpdate) {
        object.obj.position.copy(object.objBody.position)
        object.obj.quaternion.copy(object.objBody.quaternion)
    }
    updateRayCaster()

   // renderer
   renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
/**
 * End Rendering
 */