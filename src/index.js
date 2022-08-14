import "./main.css"

import * as THREE from 'three'
import * as dat from 'lil-gui'
import gsap from 'gsap'
import CANNON, { Vec3 } from "cannon"
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

// material
const defaultMaterial = new CANNON.Material('default')
const contactMaterial = new CANNON.ContactMaterial(
   defaultMaterial, 
   defaultMaterial,
   {
      friction: 0.1,
      restitution: 0.7
   }
)
world.addContactMaterial(contactMaterial)

const gui = new dat.GUI()

const sizes = {
   width: window.innerWidth,
   height: window.innerHeight,
}

const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 1, -10)
/**
 * End Setup
 */
// lights
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

/**
 * Floor
 */
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

const objectsToUpdate = []
const forceSphere = []

const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const sphereGeometry = new THREE.SphereGeometry(.5, 20, 20)
const material = new THREE.MeshStandardMaterial({color: '#777777',})

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
}

for(let i = 0; i <= 3; i++) {
   for(let j = 0; j <= 3; j++) {
      createBox({x: i * -1, y: j * 1, z: 0})
      createBox({x: i * -1, y: j * 1, z: 1})
      createBox({x: i * -1, y: j * 1, z: 2})
   }
}


// not done
const createSphere = () => {
   // three.js sphere
   const sphere = new THREE.Mesh(
      sphereGeometry,
      material
   )
   // sphere.position.copy(camera.position)
   sphere.position.set(2, 0.5, 0)
   sphere.castShadow = true

   // physic sphere
   const pSphereShape = new CANNON.Sphere(0.5)
   const pSphereBody = new CANNON.Body({
      material: defaultMaterial,
      mass: 1,
      shape: pSphereShape
   })
   pSphereBody.position.copy(sphere.position)

   forceSphere.push({
      obj: sphere,
      objBody: pSphereBody
   })

   world.addBody(pSphereBody)
   scene.add(sphere)
}
window.addEventListener('click', (e) => {
   let x = +((e.clientX / sizes.width) * 10).toFixed(2)
   let y = +((e.clientY / sizes.height) * 10).toFixed(2)
   console.log(x, y);
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

   // for(const object of forceSphere) {
   //    object.objBody.applyLocalForce(new CANNON.Vec3(.5, 0, 0),  object.objBody.position)
   //    object.obj.position.copy(object.objBody.position)
   // }

    for(const object of objectsToUpdate) {
        object.obj.position.copy(object.objBody.position)
        object.obj.quaternion.copy(object.objBody.quaternion)
    }

   //  console.log(objectsToUpdate[0].objBody.position.y);

   // renderer
   renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
/**
 * End Rendering
 */